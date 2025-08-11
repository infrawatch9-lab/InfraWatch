import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType, ServiceStatus } from '@prisma/client';
import {
  CreatePingServiceDto,
  CreatePingConfigDto,
  UpdatePingConfigDto,
  PingServiceResponseDto,
  PingTestDto,
  PingTestResultDto,
  PingHealthDto,
} from './ping.entity';

const execAsync = promisify(exec);

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPingService(
    data: CreatePingServiceDto,
  ): Promise<PingServiceResponseDto> {
    try {
      const teamId = data.teamId || 1;

      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundException('Equipe não encontrada');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        const service = await prisma.service.create({
          data: {
            name: data.name,
            description: data.description || 'Serviço de ping',
            type: ServiceType.SERVER,
            teamId: teamId,
          },
        });

        await prisma.monitoringConfig.create({
          data: {
            serviceId: service.id,
            frequency: data.pingConfig.frequency,
            timeout: data.pingConfig.timeout,
            webhookUrl: data.pingConfig.webhookUrl,
          },
        });

        const pingConfig = await prisma.pingConfig.create({
          data: {
            serviceId: service.id,
            ipAddress: data.pingConfig.ipAddress,
            packetSize: data.pingConfig.packetSize || 32,
            ttl: data.pingConfig.ttl || 64,
            monitoringMode: data.pingConfig.monitoringMode || 'agent',
            cronExpression: data.pingConfig.cronExpression,
            timezone: data.pingConfig.timezone,
            startTime: data.pingConfig.startTime,
            endTime: data.pingConfig.endTime,
            agentVersion: data.pingConfig.agentVersion,
            autoGenerate: data.pingConfig.autoGenerate,
            interval:
              data.pingConfig.interval || data.pingConfig.frequency || 60,
            timeout: data.pingConfig.timeout || 5000,
            retries: data.pingConfig.retries,
            delay: data.pingConfig.delay,
            alertAfterFailures: data.pingConfig.alertAfterFailures,
            minAlertInterval: data.pingConfig.minAlertInterval,
          },
        });

        return { service, pingConfig };
      });

      this.logger.log(`Serviço de ping criado: ${result.service.name}`);

      return {
        id: result.service.id,
        name: result.service.name,
        description: result.service.description,
        endpoint: data.endpoint,
        status: result.service.status,
        teamId: result.service.teamId,
        createdAt: result.service.createdAt,
        pingConfig: {
          id: result.pingConfig.id,
          serviceId: result.pingConfig.serviceId,
          ipAddress: result.pingConfig.ipAddress,
          packetSize: result.pingConfig.packetSize || undefined,
          ttl: result.pingConfig.ttl || undefined,
          monitoringMode: result.pingConfig.monitoringMode,
          cronExpression: result.pingConfig.cronExpression || undefined,
          timezone: result.pingConfig.timezone || undefined,
          startTime: result.pingConfig.startTime || undefined,
          endTime: result.pingConfig.endTime || undefined,
          agentVersion: result.pingConfig.agentVersion || undefined,
          autoGenerate: result.pingConfig.autoGenerate || undefined,
          interval: result.pingConfig.interval,
          timeout: result.pingConfig.timeout,
          retries: result.pingConfig.retries || undefined,
          delay: result.pingConfig.delay || undefined,
          alertAfterFailures: result.pingConfig.alertAfterFailures || undefined,
          minAlertInterval: result.pingConfig.minAlertInterval || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao criar serviço de ping:', error);
      throw error;
    }
  }

  async getAllPingServices(): Promise<PingServiceResponseDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        type: ServiceType.SERVER,
        PingConfig: {
          isNot: null,
        },
      },
      include: {
        PingConfig: true,
      },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      endpoint: service.PingConfig?.ipAddress || '',
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
      pingConfig: {
        id: service.PingConfig!.id,
        serviceId: service.PingConfig!.serviceId,
        ipAddress: service.PingConfig!.ipAddress,
        packetSize: service.PingConfig!.packetSize || undefined,
        ttl: service.PingConfig!.ttl || undefined,
        monitoringMode: service.PingConfig!.monitoringMode,
        cronExpression: service.PingConfig!.cronExpression || undefined,
        timezone: service.PingConfig!.timezone || undefined,
        startTime: service.PingConfig!.startTime || undefined,
        endTime: service.PingConfig!.endTime || undefined,
        agentVersion: service.PingConfig!.agentVersion || undefined,
        autoGenerate: service.PingConfig!.autoGenerate || undefined,
        interval: service.PingConfig!.interval,
        timeout: service.PingConfig!.timeout,
        retries: service.PingConfig!.retries || undefined,
        delay: service.PingConfig!.delay || undefined,
        alertAfterFailures: service.PingConfig!.alertAfterFailures || undefined,
        minAlertInterval: service.PingConfig!.minAlertInterval || undefined,
      },
    }));
  }

  async getPingServiceById(id: number): Promise<PingServiceResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        PingConfig: true,
      },
    });

    if (!service || !service.PingConfig) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      endpoint: service.PingConfig.ipAddress,
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
      pingConfig: {
        id: service.PingConfig.id,
        serviceId: service.PingConfig.serviceId,
        ipAddress: service.PingConfig.ipAddress,
        packetSize: service.PingConfig.packetSize || undefined,
        ttl: service.PingConfig.ttl || undefined,
        monitoringMode: service.PingConfig.monitoringMode,
        cronExpression: service.PingConfig.cronExpression || undefined,
        timezone: service.PingConfig.timezone || undefined,
        startTime: service.PingConfig.startTime || undefined,
        endTime: service.PingConfig.endTime || undefined,
        agentVersion: service.PingConfig.agentVersion || undefined,
        autoGenerate: service.PingConfig.autoGenerate || undefined,
        interval: service.PingConfig.interval,
        timeout: service.PingConfig.timeout,
        retries: service.PingConfig.retries || undefined,
        delay: service.PingConfig.delay || undefined,
        alertAfterFailures: service.PingConfig.alertAfterFailures || undefined,
        minAlertInterval: service.PingConfig.minAlertInterval || undefined,
      },
    };
  }

  async updatePingConfig(
    serviceId: number,
    data: UpdatePingConfigDto,
  ): Promise<PingServiceResponseDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { PingConfig: true },
    });

    if (!existingService || !existingService.PingConfig) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    const updatedConfig = await this.prisma.pingConfig.update({
      where: { serviceId },
      data: {
        ...data,
      },
    });

    return this.getPingServiceById(serviceId);
  }

  async deletePingService(id: number): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { PingConfig: true },
    });

    if (!service || !service.PingConfig) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.pingConfig.delete({
        where: { serviceId: id },
      });

      await prisma.monitoringConfig.deleteMany({
        where: { serviceId: id },
      });

      await prisma.service.delete({
        where: { id },
      });
    });

    this.logger.log(`Serviço de ping deletado: ${service.name}`);
  }

  async testConnectivity(data: PingTestDto): Promise<PingTestResultDto> {
    const startTime = Date.now();

    try {
      const command = this.buildPingCommand(
        data.hostname,
        data.timeout || 5000,
      );
      const { stdout } = await execAsync(command);
      const latency = this.extractLatency(stdout);

      return {
        success: true,
        latency: latency || undefined,
        hostname: data.hostname,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        hostname: data.hostname,
        timestamp: new Date(),
      };
    }
  }

  async executePing(service: any, config: any): Promise<PingHealthDto> {
    const startTime = Date.now();

    try {
      const hostname = this.extractHostname(
        config.ipAddress || service.endpoint,
      );

      this.logger.debug(
        `Fazendo ping para ${hostname} (serviço: ${service.name})`,
      );

      const command = this.buildPingCommand(hostname, config.timeout || 5000);
      const { stdout } = await execAsync(command);

      const latency = this.extractLatency(stdout);

      this.logger.log(`✅ Ping OK para ${service.name}: ${latency}ms`);

      return {
        serviceId: service.id,
        status: ServiceStatus.UP,
        latency: latency || Date.now() - startTime,
        timestamp: new Date(),
        metrics: {
          pingLatency: latency || undefined,
          hostname: hostname,
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Ping falhou para ${service.name} (${errMessage})`);

      return {
        serviceId: service.id,
        status: ServiceStatus.DOWN,
        latency,
        errorMessage: errMessage,
        timestamp: new Date(),
        metrics: {
          hostname: this.extractHostname(config.ipAddress || service.endpoint),
          errorCode:
            typeof error === 'object' && error !== null && 'code' in error
              ? (error as any).code
              : undefined,
        },
      };
    }
  }

  private buildPingCommand(hostname: string, timeout: number): string {
    const timeoutSeconds = Math.ceil(timeout / 1000);

    if (process.platform === 'win32') {
      return `ping -n 1 -w ${timeout} ${hostname}`;
    } else {
      return `ping -c 1 -W ${timeoutSeconds} ${hostname}`;
    }
  }

  private extractHostname(endpoint: string): string {
    try {
      const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
      const hostname = cleanEndpoint.split(':')[0];
      return hostname.split('/')[0];
    } catch {
      return endpoint;
    }
  }

  private extractLatency(pingOutput: string): number | null {
    const unixMatch = pingOutput.match(/time[<=](\d+\.?\d*)/);
    if (unixMatch) {
      return parseFloat(unixMatch[1]);
    }

    const windowsMatch = pingOutput.match(/Average = (\d+)ms/);
    if (windowsMatch) {
      return parseInt(windowsMatch[1], 10);
    }

    const timeMatch = pingOutput.match(/(\d+\.?\d*)\s*ms/);
    if (timeMatch) {
      return parseFloat(timeMatch[1]);
    }

    return null;
  }

  async create(data: CreatePingServiceDto): Promise<PingServiceResponseDto> {
    return this.createPingService(data);
  }

  async findAll(): Promise<PingServiceResponseDto[]> {
    return this.getAllPingServices();
  }

  async findOne(id: number): Promise<PingServiceResponseDto> {
    return this.getPingServiceById(id);
  }

  async update(
    id: number,
    data: UpdatePingConfigDto,
  ): Promise<PingServiceResponseDto> {
    return this.updatePingConfig(id, data);
  }

  async remove(id: number): Promise<void> {
    return this.deletePingService(id);
  }

  async removeAll(): Promise<void> {
    try {
      const pingServices = await this.prisma.service.findMany({
        where: {
          type: ServiceType.SERVER,
          PingConfig: {
            isNot: null,
          },
        },
        select: { id: true, name: true },
      });

      if (pingServices.length === 0) {
        this.logger.log('Nenhum serviço de ping encontrado para remoção');
        return;
      }

      await this.prisma.$transaction(async (prisma) => {
        const serviceIds = pingServices.map((s) => s.id);

        await prisma.pingConfig.deleteMany({
          where: { serviceId: { in: serviceIds } },
        });

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
        `${pingServices.length} serviços de ping removidos com sucesso`,
      );
    } catch (error) {
      this.logger.error('Erro ao remover todos os serviços de ping:', error);
      throw error;
    }
  }
}
