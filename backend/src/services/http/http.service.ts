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
import { MicroservicesGateway } from '../../ws/microservices.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class HttpService {
    private readonly logger = new Logger(HttpService.name);

    constructor(private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly microservicesGateway: MicroservicesGateway,
    ) {}

  async create(createServiceDto: HttpDto): Promise<any> {
    try {

      const teamId = createServiceDto.teamId || 1;
      this.logger.log(`Creating HTTP service for team ID: ${teamId}`);
      const checkIfServiceExists = await this.prisma.service.findFirst({
        where: {
          name: createServiceDto.name,
          type: $Enums.ServiceType.HTTP,
        },
      });

      console.log("name", createServiceDto.name);
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
            type: ServiceType.HTTP,
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

        // 3. Criar HTTP Config
        const httpConfig = await prisma.httpConfig.create({
          data: {
            serviceId: service.id,
            monitoringId: monitoringConfig.id,
            endpoint: createServiceDto.httpConfig?.endpoint || '',
            method: createServiceDto.httpConfig?.method || 'GET',
            headers: createServiceDto.httpConfig?.headers || {},
            body: createServiceDto.httpConfig?.body || {},
            authType: createServiceDto.httpConfig?.authType || 'none',
            authValue: createServiceDto.httpConfig?.authValue || '',
            validateSSL: createServiceDto.httpConfig?.validateSSL || true,
            followRedirects: createServiceDto.httpConfig?.followRedirects || true,
            expectedStatus: createServiceDto.httpConfig?.expectedStatus || 200,
            expectedBodyIncludes: createServiceDto.httpConfig?.expectedBodyIncludes || '',
            expectedResponseTimeMs: createServiceDto.httpConfig?.expectedResponseTimeMs || 1000,
            expectedHeadersIncludes: createServiceDto.httpConfig?.expectedHeadersIncludes || {},
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
          httpConfig,
          usersToNotify: createServiceDto.usersToNotify,
        };
      });

      
      return result;
    } catch (error) {
      this.logger.error('Error creating HTTP service', error);
      throw new NotFoundException('Error creating HTTP service');
    }
  }

    async findAll(): Promise<any[]> {
      const services = await this.prisma.service.findMany({
        where: {
          type: ServiceType.HTTP,
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

    return service;
  }

  async update(
    serviceId: number,
    data: HttpDto,
  ): Promise<any> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }

    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        type: ServiceType.HTTP,
      },
    });

    // Atualiza MonitoringConfig relacionado ao serviço
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId: serviceId },
    });

    if (monitoringConfig && data.httpConfig) {
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.monitoringConfig.interval,
          timeout: data.monitoringConfig.timeout,
          webhookUrl: data.monitoringConfig.webhookUrl,
        },
      });

      // Atualiza HttpConfig relacionado ao MonitoringConfig
      await this.prisma.httpConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
            monitoringId: monitoringConfig.id,
            endpoint: data.httpConfig.endpoint,
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

    const updatedService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            HttpConfig: true,
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
      action : 'update',
      id : updatedService.id,
      name: updatedService.name,
      description: updatedService.description,
      type: updatedService.type,
      status: updatedService.status,
      teamId: updatedService.teamId,
      configs: updatedService?.configs,
      rules: updatedService.rules,
    };
    
    // atualiza o monitoramento por websocket
    this.microservicesGateway.handleMessageRest({
      from: 'InfraWatch',
      to: 'HttpMonitoring',
      payload: to_send,
    });

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
      throw new NotFoundException('Serviço de HTTP não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de HTTP não encontrado');
      }
    });
      return { message: 'Serviço de HTTP removido com sucesso' };
  }

  async removeAll(): Promise<any> {
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.HTTP } });

    if (result.count === 0) {
      throw new NotFoundException('Nenhum serviço de HTTP encontrado para remover');
    }

    return { message: 'Todos os serviços de HTTP foram removidos com sucesso' };
  }
}
