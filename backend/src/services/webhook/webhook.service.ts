import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  WebhookDto,
} from './webhook.entity';
import { ServiceType } from '@prisma/client';
import { $Enums } from '@prisma/client';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: WebhookDto): Promise<any> {
    try {

      const teamId = createServiceDto.teamId || 1;

      const checkIfServiceExists = await this.prisma.service.findFirst({
        where: {
          name: createServiceDto.name,
          type: ServiceType.WEBHOOK,
        },
      });

      if (checkIfServiceExists)
      {
        this.logger.warn(`Service with name ${createServiceDto.name} already exists for team ID ${teamId}`);
        return { message: 'Service already exists' };
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        let team = await prisma.team.findUnique({ where: { id: teamId } });

        if (!team) {
          team = await prisma.team.create({
            data: { name: `Team ${teamId}` },
          });
          this.logger.log(`Team created with ID: ${team.id}`);
        }

        const service = await prisma.service.create({
          data: {
            name: createServiceDto.name,
            description: createServiceDto.description,
            type: ServiceType.WEBHOOK,
            teamId: team.id,
          },
        });

        // Se vieram emails para notificação
        if (createServiceDto.usersToNotify?.length) {
          const users = await prisma.user.findMany({
            where: { email: { in: createServiceDto.usersToNotify } },
            select: { id: true },
          });

          console.log(`Users found for notification: ${users.length}`);
          if (users.length) {
            await prisma.serviceUserNotification.createMany({
              data: users.map(u => ({
                serviceId: service.id,
                userId: u.id,
              })),
            });
          }
        } else {
          this.logger.warn('No emails provided for notification');
        }

        // 2. Criar MonitoringConfig
        const monitoringConfig = await prisma.monitoringConfig.create({
          data: {
            serviceId: service.id,
            interval: createServiceDto.monitoringConfig?.interval || 60,
            timeout: createServiceDto.monitoringConfig?.timeout || 5000,
            webhookUrl: createServiceDto.monitoringConfig?.webhookUrl || null,
          },
        });

        // 3. Criar Webhook Config
        const webhookConfig = await prisma.webhookConfig.create({
          data: {
            serviceId: service.id,
            monitoringId: monitoringConfig.id,
            endpoint: createServiceDto.webhookConfig?.endpoint || '',
            method: createServiceDto.webhookConfig?.method || 'GET',
            secret: createServiceDto.webhookConfig?.secret || null,
            headers: createServiceDto.webhookConfig?.headers || {},
          },
        });

      // 4. Criar alert rules
      if (createServiceDto.rules?.length) {
        await prisma.alertRule.createMany({
          data: createServiceDto.rules.map(rule => ({
            serviceId: service.id,
            field: rule.field,
            condition: rule.condition,
            severity: $Enums.AlertLevel[rule.severity as keyof typeof $Enums.AlertLevel],
            createdBy: rule.createdBy,
            active: rule.active ?? true,
          })),
        });
      }

        return {
          service,
          monitoringConfig,
          webhookConfig,
          usersToNotify: createServiceDto.usersToNotify,
        };
      });

      
      return result;
    } catch (error) {
      this.logger.error('Error creating Webhook service', error);
      throw new NotFoundException('Error creating Webhook service');
    }
  }

    async findAll(): Promise<any[]> {
      const services = await this.prisma.service.findMany({
        where: {
          type: ServiceType.WEBHOOK,
        },
      });

      return services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        status: service.status,
        teamId: service.teamId,
        createdAt: service.createdAt,
      }));
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
            WebhookConfig: true,
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
      throw new NotFoundException('Serviço de Webhook não encontrado');
    }

    return service;
  }

  async update(
    serviceId: number,
    data: WebhookDto,
  ): Promise<any> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço de Webhook não encontrado');
    }

    const service = await this.prisma.service.update({
        where: { id: serviceId },
        data: {
            name: data.name,
            description: data.description,
            type: ServiceType.WEBHOOK,
        },
    });

    // Atualiza MonitoringConfig relacionado ao serviço
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId: serviceId },
    });

    if (monitoringConfig && data.webhookConfig) {
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.monitoringConfig?.interval,
          timeout: data.monitoringConfig?.timeout,
          webhookUrl: data.monitoringConfig?.webhookUrl,
        },
      });

      // Atualiza WebhookConfig relacionado ao MonitoringConfig
      await this.prisma.webhookConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
            serviceId: serviceId,
            monitoringId: monitoringConfig.id,
            endpoint: data.webhookConfig?.endpoint || '',
            method: data.webhookConfig?.method || 'GET',
            secret: data.webhookConfig?.secret || null,
            headers: data.webhookConfig?.headers || {},
        },
      });
    }

    return this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            WebhookConfig: true,
          },
        },
        usersToNotify: {},
        rules: true,
        alerts: true,
        metrics: true,
        slas: true,
        logs: true,
        Team: true,
      },
    });
  }

  async remove(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de Webhook não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de Webhook não encontrado');
      }
    });
      return { message: 'Serviço de Webhook removido com sucesso' };
  }

  async removeAll(): Promise<any> {
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.WEBHOOK } });

    if (result.count === 0) {
      throw new NotFoundException('Nenhum serviço de Webhook encontrado para remover');
    }

    return { message: 'Todos os serviços de Webhook foram removidos com sucesso' };
  }
}
