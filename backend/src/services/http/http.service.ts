import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType, ServiceStatus } from '@prisma/client';
import {
  CreateHttpServiceDto,
  CreateHttpConfigDto,
  UpdateHttpConfigDto,
  HttpServiceResponseDto,
  HttpTestDto,
  HttpTestResultDto,
  HttpHealthDto,
} from './http.entity';

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createHttpService(
    data: CreateHttpServiceDto,
  ): Promise<HttpServiceResponseDto> {
    try {
      const teamId = data.teamId || 1;

      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundException('Equipe não encontrada');
      }

      if (!this.isValidUrl(data.endpoint)) {
        throw new BadRequestException('URL inválida');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        const service = await prisma.service.create({
          data: {
            name: data.name,
            description: data.description || 'Serviço HTTP',
            type: this.getServiceTypeFromUrl(data.endpoint),
            teamId: teamId,
          },
        });

        const monitoringConfig = await prisma.monitoringConfig.create({
          data: {
            serviceId: service.id,
            frequency: data.httpConfig.frequency,
            timeout: data.httpConfig.timeout,
            webhookUrl: data.httpConfig.webhookUrl,
          },
        });

        return { service, monitoringConfig, httpConfig: data.httpConfig };
      });

      this.logger.log(`Serviço HTTP criado: ${result.service.name}`);

      return {
        id: result.service.id,
        name: result.service.name,
        description: result.service.description,
        endpoint: data.endpoint,
        status: result.service.status,
        teamId: result.service.teamId,
        createdAt: result.service.createdAt,
        httpConfig: {
          id: result.monitoringConfig.id,
          serviceId: result.service.id,
          method: result.httpConfig.method || 'GET',
          headers: result.httpConfig.headers,
          body: result.httpConfig.body,
          expectedStatusCodes: result.httpConfig.expectedStatusCodes,
          followRedirects: result.httpConfig.followRedirects ?? true,
          sslVerification: result.httpConfig.sslVerification ?? true,
          timeout: result.httpConfig.timeout,
          frequency: result.httpConfig.frequency,
          retries: result.httpConfig.retries,
          retryDelay: result.httpConfig.retryDelay,
          webhookUrl: result.httpConfig.webhookUrl,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao criar serviço HTTP:', error);
      throw error;
    }
  }

  async getAllHttpServices(): Promise<HttpServiceResponseDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        type: {
          in: [ServiceType.WEBSITE, ServiceType.API],
        },
      },
      include: {
        configs: true,
      },
    });

    return services.map((service) => {
      const config = service.configs[0];
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        endpoint: '',
        status: service.status,
        teamId: service.teamId,
        createdAt: service.createdAt,
        httpConfig: {
          id: config?.id || 0,
          serviceId: service.id,
          method: 'GET',
          headers: undefined,
          body: undefined,
          expectedStatusCodes: undefined,
          followRedirects: true,
          sslVerification: true,
          timeout: config?.timeout || 5000,
          frequency: config?.frequency || 60,
          retries: undefined,
          retryDelay: undefined,
          webhookUrl: config?.webhookUrl || undefined,
        },
      };
    });
  }

  async getHttpServiceById(id: number): Promise<HttpServiceResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        configs: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço HTTP não encontrado');
    }

    const config = service.configs[0];

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      endpoint: '',
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
      httpConfig: {
        id: config?.id || 0,
        serviceId: service.id,
        method: 'GET',
        headers: undefined,
        body: undefined,
        expectedStatusCodes: undefined,
        followRedirects: true,
        sslVerification: true,
        timeout: config?.timeout || 5000,
        frequency: config?.frequency || 60,
        retries: undefined,
        retryDelay: undefined,
        webhookUrl: config?.webhookUrl || undefined,
      },
    };
  }

  async updateHttpConfig(
    serviceId: number,
    data: UpdateHttpConfigDto,
  ): Promise<HttpServiceResponseDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço HTTP não encontrado');
    }

    const config = existingService.configs[0];
    if (config) {
      await this.prisma.monitoringConfig.update({
        where: { id: config.id },
        data: {
          frequency: data.frequency,
          timeout: data.timeout,
          webhookUrl: data.webhookUrl,
        },
      });
    }

    return this.getHttpServiceById(serviceId);
  }

  async deleteHttpService(id: number): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { configs: true },
    });

    if (!service) {
      throw new NotFoundException('Serviço HTTP não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.monitoringConfig.deleteMany({
        where: { serviceId: id },
      });

      await prisma.service.delete({
        where: { id },
      });
    });

    this.logger.log(`Serviço HTTP deletado: ${service.name}`);
  }

  /**
   * Testa requisição HTTP sem salvar no banco
   */
  async testHttpRequest(data: HttpTestDto): Promise<HttpTestResultDto> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        data.timeout || 5000,
      );

      const headers = {
        'User-Agent': 'InfraWatch-HTTP-Monitor/1.0',
        Accept: 'application/json',
        ...data.headers,
      };

      this.logger.debug(`Fazendo requisição HTTP para ${data.url}`);

      const response = await fetch(data.url, {
        method: data.method || 'GET',
        headers,
        body: data.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const expectedStatusCodes = data.expectedStatusCodes || [
        200, 201, 202, 204,
      ];
      const isSuccess = expectedStatusCodes.includes(response.status);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        success: isSuccess,
        statusCode: response.status,
        latency,
        url: data.url,
        timestamp: new Date(),
        responseHeaders,
        responseSize: parseInt(response.headers.get('content-length') || '0'),
        error: !isSuccess
          ? `HTTP ${response.status}: ${response.statusText}`
          : undefined,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      let errorMessage = (error as Error).message;

      if ((error as Error).name === 'AbortError') {
        errorMessage = `Timeout após ${data.timeout || 5000}ms`;
      }

      return {
        success: false,
        error: errorMessage,
        url: data.url,
        latency,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Executa requisição HTTP para monitoramento (usado pelo sistema de monitoring)
   */
  async executeHttpRequest(service: any, config: any): Promise<HttpHealthDto> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || 5000,
      );

      const headers = {
        'User-Agent': 'InfraWatch-Monitor/1.0',
        Accept: 'application/json',
        ...(config.headers && this.parseHeaders(config.headers)),
      };

      this.logger.debug(
        `Fazendo request para ${service.endpoint} (serviço: ${service.name})`,
      );

      const response = await fetch(service.endpoint, {
        method: config.method || 'GET',
        headers,
        body: config.body ? this.parseBody(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const expectedStatusCodes = config.expectedStatusCodes
        ? this.parseExpectedStatusCodes(config.expectedStatusCodes)
        : [200, 201, 202, 204];

      const isSuccess = expectedStatusCodes.includes(response.status);
      const metrics = await this.extractResponseMetrics(response);

      if (isSuccess) {
        this.logger.log(`✅ Request OK para ${service.name}: ${latency}ms`);
      }

      return {
        serviceId: service.id,
        status: isSuccess ? ServiceStatus.UP : ServiceStatus.DOWN,
        latency,
        timestamp: new Date(),
        metrics: {
          httpStatus: response.status,
          responseSize: parseInt(response.headers.get('content-length') || '0'),
          ...metrics,
        },
        errorMessage: !isSuccess
          ? `HTTP ${response.status}: ${response.statusText}`
          : undefined,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      let errorMessage = (error as Error).message;
      if ((error as Error).name === 'AbortError') {
        errorMessage = `Timeout após ${config.timeout || 5000}ms`;
      } else if (
        typeof (error as any).code === 'string' &&
        (error as any).code === 'ENOTFOUND'
      ) {
        errorMessage = `Host não encontrado: ${service.endpoint}`;
      } else if (
        typeof (error as any).code === 'string' &&
        (error as any).code === 'ECONNREFUSED'
      ) {
        errorMessage = `Conexão recusada: ${service.endpoint}`;
      }

      this.logger.error(
        `HTTP monitor falhou para ${service.name}:`,
        errorMessage,
      );

      return {
        serviceId: service.id,
        status: ServiceStatus.DOWN,
        latency,
        errorMessage,
        timestamp: new Date(),
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private getServiceTypeFromUrl(url: string): ServiceType {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (urlObj.pathname.includes('/api') || hostname.includes('api')) {
        return ServiceType.API;
      }

      return ServiceType.WEBSITE;
    } catch {
      return ServiceType.WEBSITE;
    }
  }

  private parseHeaders(headers: string): Record<string, string> {
    try {
      return JSON.parse(headers);
    } catch {
      return {};
    }
  }

  private parseBody(body: string): string {
    try {
      return JSON.stringify(JSON.parse(body));
    } catch {
      return body;
    }
  }

  private parseExpectedStatusCodes(codes: string): number[] {
    try {
      return JSON.parse(codes);
    } catch {
      return [200];
    }
  }

  private async extractResponseMetrics(
    response: Response,
  ): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const responseData = await response.clone().json();

        if (responseData.metrics) {
          Object.assign(metrics, responseData.metrics);
        }

        if (responseData.performance) {
          Object.assign(metrics, responseData.performance);
        }

        ['cpu', 'memory', 'disk', 'load', 'uptime'].forEach((key) => {
          if (responseData[key] !== undefined) {
            metrics[key] = responseData[key];
          }
        });
      }

      const serverTiming = response.headers.get('server-timing');
      if (serverTiming) {
        metrics.serverTiming = this.parseServerTiming(serverTiming);
      }

      metrics.contentType = contentType;
    } catch (error) {
      this.logger.debug(
        'Não foi possível extrair métricas da resposta:',
        (error as Error).message,
      );
    }

    return metrics;
  }

  private parseServerTiming(serverTiming: string): Record<string, number> {
    const timing: Record<string, number> = {};

    try {
      const entries = serverTiming.split(',');
      entries.forEach((entry) => {
        const [name, duration] = entry.trim().split(';dur=');
        if (name && duration) {
          timing[name] = parseFloat(duration);
        }
      });
    } catch (error) {
      this.logger.debug(
        'Erro ao parsear Server-Timing:',
        (error as Error).message,
      );
    }

    return timing;
  }

  async create(data: CreateHttpServiceDto): Promise<HttpServiceResponseDto> {
    return this.createHttpService(data);
  }

  async findAll(): Promise<HttpServiceResponseDto[]> {
    return this.getAllHttpServices();
  }

  async findOne(id: number): Promise<HttpServiceResponseDto> {
    return this.getHttpServiceById(id);
  }

  async update(
    id: number,
    data: UpdateHttpConfigDto,
  ): Promise<HttpServiceResponseDto> {
    return this.updateHttpConfig(id, data);
  }

  async remove(id: number): Promise<void> {
    return this.deleteHttpService(id);
  }

  async removeAll(): Promise<void> {
    try {
      const httpServices = await this.prisma.service.findMany({
        where: {
          OR: [{ type: ServiceType.WEBSITE }, { type: ServiceType.API }],
        },
        select: { id: true, name: true },
      });

      if (httpServices.length === 0) {
        this.logger.log('Nenhum serviço HTTP encontrado para remoção');
        return;
      }

      await this.prisma.$transaction(async (prisma) => {
        const serviceIds = httpServices.map((s) => s.id);

        await prisma.monitoringConfig.deleteMany({
          where: { serviceId: { in: serviceIds } },
        });

        await prisma.metric.deleteMany({
          where: { serviceId: { in: serviceIds } },
        });

        await prisma.alert.deleteMany({
          where: { serviceId: { in: serviceIds } },
        });

        await prisma.alertRule.deleteMany({
          where: { serviceId: { in: serviceIds } },
        });

        await prisma.service.deleteMany({
          where: { id: { in: serviceIds } },
        });
      });

      this.logger.log(
        `${httpServices.length} serviços HTTP removidos com sucesso`,
      );
    } catch (error) {
      this.logger.error('Erro ao remover todos os serviços HTTP:', error);
      throw error;
    }
  }
}
