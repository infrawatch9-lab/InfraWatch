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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MicroservicesGateway } from '../../ws/microservices.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { parseGithubWebhook } from './utils';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
      private readonly prisma: PrismaService,
      private readonly eventEmitter: EventEmitter2,
      private readonly microservicesGateway: MicroservicesGateway,
      private readonly notificationsService: NotificationsService,
    ) {}

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

        // 2. Criar Monitoring Config
        const monitoringConfig = await prisma.monitoringConfig.create({
          data: {
            serviceId: service.id,
            interval: createServiceDto.monitoringConfig?.interval || 60,
            timeout: createServiceDto.monitoringConfig?.timeout || 5,
            webhookUrl: createServiceDto.monitoringConfig?.webhookUrl || '',
          },
        });

        // se no service name tiver espacos preecnhe com underscores
        const name = service.name.replace(/\s+/g, '_');

        // 3. Criar Webhook Config
        const webhookConfig = await prisma.webhookConfig.create({
          data: {
            serviceId: service.id,
            monitoringId: monitoringConfig.id,
            method: createServiceDto.webhookConfig?.method || 'GET',
            secret: createServiceDto.webhookConfig?.secret || null,
            headers: createServiceDto.webhookConfig?.headers || {},
            provedor: createServiceDto.webhookConfig?.provedor ?? '',
            endpoint: `https://infra42luanda.duckdns.org/api/webhook/${service.id}/${name}/${createServiceDto.webhookConfig?.provedor ?? 'generic'}`,
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
        type: service.type,
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

    await this.prisma.service.update({
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

      const updatedService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            WebhookConfig: true,
          },
        },
        usersToNotify: {
          
        },
        rules: true,
        alerts: true,
        metrics: true,
        slas: true,
        logs: true,
        Team: true,
      },
    });
    
    if (!updatedService) {
      throw new NotFoundException('Serviço de SNMP atualizado não encontrado');
    }
    
    const to_send = {
      action: 'update',
      id : updatedService.id,
      name: updatedService.name,
      description: updatedService.description,
      type: updatedService.type,
      status: updatedService.status,
      teamId: updatedService.teamId,
      configs: updatedService?.configs,
      rules: updatedService.rules,
    };

    this.eventEmitter.emit('dashboard.updated', {
      serviceId,
      data,
    });

    return updatedService;
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
    await this.prisma.metric.deleteMany({ where: { Service: { type: ServiceType.WEBHOOK } } });
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.WEBHOOK } });

    // if (result.count === 0) {
    //   throw new NotFoundException('Nenhum serviço de Webhook encontrado para remover');
    // }

    return { message: 'Todos os serviços de Webhook foram removidos com sucesso' };
  }

  async handleWebhook(id: string, servico: string, provedor: string, data: any): Promise<any> {
    console.log(`Webhook recebido para o serviço [${servico}] com id [${id}] do provedor [${provedor}]`);

    const service = await this.prisma.service.findUnique({
      where: { id: Number(id) },
    });
    if (!service) {
      throw new NotFoundException('Serviço de Webhook não encontrado');
    }

    const usersToNotify = await this.prisma.serviceUserNotification.findMany({
      where: { serviceId: service.id },
      include: { User: true },
    });
        let to_send;
    if (provedor == "github") {
      to_send = parseGithubWebhook(data);
    }
    const logEntry = await this.prisma.systemLog.create({
      data: {
        serviceId: service.id,
        message: `Webhook recebido para o serviço ${service.name} do provedor ${provedor}`,
        timestamp: new Date(),
        type: $Enums.LogType.INFO,
      },
    });

    if (!logEntry) {
      this.logger.error('Erro ao criar log de sistema para o webhook recebido');
    }


    console.log(`Notificando ${usersToNotify.length} usuários associados ao serviço ${service.name}`);
    console.log("Usuários a serem notificados:", usersToNotify.map((user) => user.User.email));
    for (const userNotification of usersToNotify) {
      const user = userNotification.User;
      if (user && user.email) {
        try {
            // Envia notificação por email
            await this.notificationsService.sendAlert(
              `
              <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
              <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px;">
              <h2 style="color: #2d7ff9; margin-bottom: 16px;">InfraWatch - Notificação de Webhook</h2>
              <p style="font-size: 16px; color: #333;">Olá <strong>${user.name || 'usuário'}</strong>,</p>
              <p style="font-size: 15px; color: #333;">
                Um <strong>webhook</strong> foi recebido para o serviço <strong>${service.name}</strong>.
              </p>
              <div style="background: #f4f8fb; border-left: 4px solid #2d7ff9; padding: 16px; margin: 24px 0;">
                <pre style="font-size: 14px; color: #222; white-space: pre-wrap;">${JSON.stringify(to_send, null, 2)}</pre>
              </div>
              <p style="font-size: 15px; color: #333;">Atenciosamente,<br><strong>Equipe InfraWatch</strong></p>
              </div>
              </div>
              `,
              `:bell: Webhook recebido para o serviço *${service.name}*.\nUsuário: ${user.name || 'usuário'}\nPayload:\n\`\`\`${JSON.stringify(to_send, null, 2)}\`\`\``,
              [user.email],
            );
          
        } catch (error) {
          console.error(`Erro ao enviar email para ${user.email}:`, error);
        }
      } else {
        console.warn(`Usuário associado ao serviço ${service.name} não possui email válido.`);
      }

      this.eventEmitter.emit('webhook.received', {
        serviceId: service.id,
        data,
      });
    }

    return { message: `Webhook de ${id} recebido com sucesso` };
  }
}
