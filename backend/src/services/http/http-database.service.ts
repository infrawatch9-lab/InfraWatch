import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '@prisma/client';
import { $Enums } from '@prisma/client';
import { HttpDto } from './http.entity';

@Injectable()
export class HttpDatabaseService {
  private readonly logger = new Logger(HttpDatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateServiceDoesNotExist(name: string): Promise<void> {
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

  async createServiceWithConfigs(createServiceDto: HttpDto, teamId: number) {
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

  async findServiceById(serviceId: number) {
    return await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });
  }

  async findServiceByIdWithFullData(id: number) {
    return await this.prisma.service.findUnique({
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
  }

  async findAllHttpServices() {
    return await this.prisma.service.findMany({
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
  }

  async updateService(serviceId: number, data: HttpDto) {
    // Preparar dados para atualizar o serviço principal (apenas campos fornecidos)
    const updateData: any = {
      type: ServiceType.HTTP,
    };

    // Incluir apenas campos que foram fornecidos
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.status) updateData.status = data.status;

    // Atualizar serviço principal
    await this.prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Atualizar configurações apenas se fornecidas
    if (data.httpConfig) {
      await this.updateServiceConfigurations(serviceId, data);
    }

    // Buscar serviço atualizado com todas as relações
    return await this.findServiceByIdWithFullData(serviceId);
  }

  async updateCheckcleId(serviceId: number, checkcleId: string) {
    return await this.prisma.service.update({
      where: { id: serviceId },
      data: { checkcleId }
    });
  }

  async deleteService(id: number) {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.service.delete({ where: { id } });
    });
  }

  async deleteAllHttpServices() {
    return await this.prisma.service.deleteMany({ 
      where: { type: ServiceType.HTTP } 
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
}
