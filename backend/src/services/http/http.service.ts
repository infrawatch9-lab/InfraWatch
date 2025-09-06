import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  HttpDto,
} from './http.entity';
import { ServiceType } from '@prisma/client';
import { $Enums } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpCheckcleService } from './http-checkcle.service';

@Injectable()
export class HttpService {
    private readonly logger = new Logger(HttpService.name);

    constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly httpCheckcleService: HttpCheckcleService,
    ) {}

  async create(createServiceDto: HttpDto): Promise<any> {
    try {
      const teamId = createServiceDto.teamId || 1;
      this.logger.log(`Creating HTTP service for team ID: ${teamId}`);
      
      // Verificar se o serviço já existe
      await this.validateServiceDoesNotExist(createServiceDto.name);

      // Criar serviço no banco de dados
      const result = await this.createServiceInDatabase(createServiceDto, teamId);

      // Sincronizar com CheckCle
      await this.syncServiceWithCheckcle(result);

      return result;
    } catch (error) {
      this.logger.error('Error creating HTTP service', error);
      throw new NotFoundException('Error creating HTTP service');
    }
  }

  private async validateServiceDoesNotExist(name: string): Promise<void> {
    const existingService = await this.prisma.service.findFirst({
      where: {
        name,
        type: $Enums.ServiceType.HTTP,
      },
    });

    if (existingService) {
      this.logger.warn(`Service with name ${name} already exists`);
      throw new Error('Service already exists');
    }
  }

  private async createServiceInDatabase(createServiceDto: HttpDto, teamId: number) {
    return await this.prisma.$transaction(async (prisma) => {
      // Criar ou encontrar team
      const team = await this.findOrCreateTeam(prisma, teamId);

      // Criar serviço principal
      const service = await prisma.service.create({
        data: {
          name: createServiceDto.name,
          description: createServiceDto.description,
          type: ServiceType.HTTP,
          teamId: team.id,
        },
      });

      // Configurar notificações de usuários
      await this.setupUserNotifications(prisma, service.id, createServiceDto.usersToNotify);

      // Criar configuração de monitoramento
      const monitoringConfig = await this.createMonitoringConfig(prisma, service.id, createServiceDto.monitoringConfig);

      // Criar configuração HTTP
      const httpConfig = await this.createHttpConfig(prisma, service.id, monitoringConfig.id, createServiceDto.httpConfig);

      // Criar regras de alerta
      await this.createAlertRules(prisma, service.id, createServiceDto.rules);

      return {
        service,
        monitoringConfig,
        httpConfig,
        usersToNotify: createServiceDto.usersToNotify,
      };
    });
  }

  private async findOrCreateTeam(prisma: any, teamId: number) {
    let team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      team = await prisma.team.create({
        data: { name: `Team ${teamId}` },
      });
      this.logger.log(`Team created with ID: ${team.id}`);
    }

    return team;
  }

  private async setupUserNotifications(prisma: any, serviceId: number, usersToNotify?: string[]) {
    if (usersToNotify?.length) {
      const users = await prisma.user.findMany({
        where: { email: { in: usersToNotify } },
        select: { id: true },
      });

      this.logger.log(`Users found for notification: ${users.length}`);
      if (users.length) {
        await prisma.serviceUserNotification.createMany({
          data: users.map((u: { id: number }) => ({
            serviceId,
            userId: u.id,
          })),
        });
      }
    } else {
      this.logger.warn('No emails provided for notification');
    }
  }

  private async createMonitoringConfig(prisma: any, serviceId: number, config?: any) {
    return await prisma.monitoringConfig.create({
      data: {
        serviceId,
        interval: config?.interval || 60,
        timeout: config?.timeout || 5000,
        webhookUrl: config?.webhookUrl || null,
      },
    });
  }

  private async createHttpConfig(prisma: any, serviceId: number, monitoringId: number, config?: any) {
    return await prisma.httpConfig.create({
      data: {
        serviceId,
        monitoringId,
        endpoint: config?.endpoint || '',
        method: config?.method || 'GET',
        headers: config?.headers || {},
        body: config?.body || {},
        authType: config?.authType || 'none',
        authValue: config?.authValue || '',
        validateSSL: config?.validateSSL || true,
        followRedirects: config?.followRedirects || true,
        expectedStatus: config?.expectedStatus || 200,
        expectedBodyIncludes: config?.expectedBodyIncludes || '',
        expectedResponseTimeMs: config?.expectedResponseTimeMs || 1000,
        expectedHeadersIncludes: config?.expectedHeadersIncludes || {},
      },
    });
  }

  private async createAlertRules(prisma: any, serviceId: number, rules?: any[]) {
    if (rules?.length) {
      await prisma.alertRule.createMany({
        data: rules.map(rule => ({
          serviceId,
          field: rule.field,
          condition: rule.condition,
          severity: $Enums.AlertLevel[rule.severity as keyof typeof $Enums.AlertLevel],
          createdBy: rule.createdBy,
          active: rule.active ?? true,
        })),
      });
    }
  }

  private async syncServiceWithCheckcle(result: any) {
    try {
      const checkcleData = this.httpCheckcleService.mapToCheckcleFormat(
        result.service,
        result.httpConfig,
        result.monitoringConfig
      );
      
      const checkcleResponse = await this.httpCheckcleService.syncWithCheckcle('create', checkcleData);
      
      // Atualizar o serviço com o CheckCle ID
      await this.prisma.service.update({
        where: { id: result.service.id },
        data: { checkcleId: checkcleResponse.checkcleId }
      });
      
      this.logger.log(`Serviço HTTP ${result.service.id} sincronizado com CheckCle: ${checkcleResponse.checkcleId}`);
      
      // Adicionar o checkcleId ao resultado
      result.service.checkcleId = checkcleResponse.checkcleId;
    } catch (checkcleError) {
      this.logger.error(`Erro ao sincronizar com CheckCle para serviço ${result.service.id}:`, checkcleError);
      // Não falhar a criação do serviço se a sincronização com CheckCle falhar
    }
  }

  async findAll(): Promise<any[]> {
    const services = await this.prisma.service.findMany({
      where: {
        type: ServiceType.HTTP,
      },
      include: {
        usersToNotify: {
          include: {
            User: true,
          },
        },
        Team: true,
      },
    });

    // Merge cada serviço com dados do CheckCle em paralelo
    return await this.mergeServicesWithCheckcleData(services);
  }

  private async mergeServicesWithCheckcleData(services: any[]): Promise<any[]> {
    return await Promise.all(
      services.map(async (service) => {
        try {
          return await this.httpCheckcleService.mergeServiceWithCheckcleData(service);
        } catch (error) {
          this.logger.error(`Erro ao fazer merge com CheckCle para serviço ${service.id}:`, error);
          return this.createFallbackServiceData(service);
        }
      })
    );
  }

  private createFallbackServiceData(service: any) {
    return {
      id: service.id,
      name: service.name,
      type: service.type,
      description: service.description,
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
      lastChecked: null,
      responseTime: null,
      uptime: 0
    };
  }

  async findOne(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        usersToNotify: {
          include: {
            User: true,
          },
        },
        configs: {
          include: {
            HttpConfig: true,
          },
        },
        rules: true,
        alerts: true,
        metrics: true,
        slas: true,
        logs: true,
        Team: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }

    // Merge com dados do CheckCle se disponível
    try {
      return await this.httpCheckcleService.mergeServiceWithCheckcleData(service);
    } catch (error) {
      this.logger.error(`Erro ao fazer merge com dados do CheckCle para serviço ${id}:`, error);
      return service; // Retorna dados do banco se falhar o merge
    }
  }

  async update(serviceId: number, data: HttpDto): Promise<any> {
    const existingService = await this.findServiceById(serviceId);
    
    // Atualizar dados do serviço
    const updatedService = await this.updateServiceInDatabase(serviceId, data);
    
    // Emitir evento de atualização
    this.eventEmitter.emit('dashboard.updated', { serviceId, data });

    // Sincronizar com CheckCle
    await this.syncUpdatedServiceWithCheckcle(updatedService, serviceId);

    return updatedService;
  }

  private async findServiceById(serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!service) {
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }

    return service;
  }

  private async updateServiceInDatabase(serviceId: number, data: HttpDto) {
    // Atualizar serviço principal
    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        type: ServiceType.HTTP,
      },
    });

    // Atualizar configurações se fornecidas
    if (data.httpConfig) {
      await this.updateServiceConfigurations(serviceId, data);
    }

    // Buscar serviço atualizado com todas as relações
    return await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            HttpConfig: true,
          },
        },
        usersToNotify: true,
        rules: true,
        alerts: true,
        metrics: true,
        slas: true,
        logs: true,
        Team: true,
      },
    });
  }

  private async updateServiceConfigurations(serviceId: number, data: HttpDto) {
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId },
    });

    if (monitoringConfig) {
      // Atualizar MonitoringConfig
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.monitoringConfig?.interval,
          timeout: data.monitoringConfig?.timeout,
          webhookUrl: data.monitoringConfig?.webhookUrl,
        },
      });

      // Atualizar HttpConfig
      await this.prisma.httpConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
          endpoint: data.httpConfig?.endpoint,
          method: data.httpConfig?.method || 'GET',
          headers: data.httpConfig?.headers || {},
          body: data.httpConfig?.body || {},
          authType: data.httpConfig?.authType || 'none',
          authValue: data.httpConfig?.authValue || '',
          validateSSL: data.httpConfig?.validateSSL || true,
          followRedirects: data.httpConfig?.followRedirects || true,
          expectedStatus: data.httpConfig?.expectedStatus || 200,
          expectedBodyIncludes: data.httpConfig?.expectedBodyIncludes || '',
          expectedResponseTimeMs: data.httpConfig?.expectedResponseTimeMs || 1000,
          expectedHeadersIncludes: data.httpConfig?.expectedHeadersIncludes || {},
        },
      });
    }
  }

  private async syncUpdatedServiceWithCheckcle(updatedService: any, serviceId: number) {
    try {
      if (updatedService?.checkcleId) {
        const httpConfig = updatedService.configs?.HttpConfig;
        const monitoringConfig = updatedService.configs;
        
        if (httpConfig && monitoringConfig) {
          const checkcleData = this.httpCheckcleService.mapToCheckcleFormat(
            updatedService,
            httpConfig,
            monitoringConfig
          );
          
          await this.httpCheckcleService.syncWithCheckcle('update', checkcleData, updatedService.checkcleId);
          this.logger.log(`Serviço HTTP ${serviceId} atualizado no CheckCle`);
        }
      } else {
        this.logger.warn(`Serviço HTTP ${serviceId} não possui CheckCle ID para atualização`);
      }
    } catch (checkcleError) {
      this.logger.error(`Erro ao atualizar serviço no CheckCle para ${serviceId}:`, checkcleError);
    }
  }

  async remove(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }

    // Deletar do CheckCle primeiro
    await this.deleteServiceFromCheckcle(service, id);

    // Deletar do banco de dados
    await this.deleteServiceFromDatabase(id);
    
    return { message: 'Serviço de HTTP removido com sucesso' };
  }

  private async deleteServiceFromCheckcle(service: any, id: number) {
    if (service.checkcleId) {
      try {
        await this.httpCheckcleService.syncWithCheckcle('delete', undefined, service.checkcleId);
        this.logger.log(`Serviço HTTP ${id} deletado do CheckCle`);
      } catch (checkcleError) {
        this.logger.error(`Erro ao deletar serviço do CheckCle para ${id}:`, checkcleError);
        // Continuar com a deleção local mesmo se falhar no CheckCle
      }
    }
  }

  private async deleteServiceFromDatabase(id: number) {
    await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de HTTP não encontrado');
      }
    });
  }

  async removeAll(): Promise<any> {
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.HTTP } });

    // if (result.count === 0) {
    //   throw new NotFoundException('Nenhum serviço de HTTP encontrado para remover');
    // }

    return { message: 'Todos os serviços de HTTP foram removidos com sucesso' };
  }
}
