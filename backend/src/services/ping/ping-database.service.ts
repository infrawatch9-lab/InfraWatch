import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '@prisma/client';
import { CreatePingServiceDto } from './ping.entity';
import { $Enums } from '@prisma/client';

@Injectable()
export class PingDatabaseService {
  private readonly logger = new Logger(PingDatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se um serviço ping já existe
   */
  async checkServiceExists(name: string): Promise<boolean> {
    const existingService = await this.prisma.service.findFirst({
      where: {
        name,
        type: ServiceType.PING,
      },
    });
    return !!existingService;
  }

  /**
   * Cria um serviço ping completo no banco de dados
   */
  async createPingServiceTransaction(data: CreatePingServiceDto): Promise<any> {
    const teamId = data.teamId || 1;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Garantir que o team existe
      let team = await prisma.team.findUnique({ where: { id: teamId } });

      if (!team) {
        team = await prisma.team.create({
          data: { name: `Team ${teamId}` },
        });
        this.logger.log(`Team created with ID: ${team.id}`);
      }

      // 2. Criar o serviço
      const service = await prisma.service.create({
        data: {
          name: data.name,
          description: data.description,
          type: ServiceType.PING,
          teamId: team.id,
        },
      });

      // 3. Configurar notificações de usuários
      if (data.usersToNotify?.length) {
        const users = await prisma.user.findMany({
          where: { email: { in: data.usersToNotify } },
          select: { id: true },
        });

        this.logger.log(`Users found for notification: ${users.length}`);
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

      // 4. Criar MonitoringConfig
      const monitoringConfig = await prisma.monitoringConfig.create({
        data: {
          serviceId: service.id,
          interval: data.pingConfig.interval || 60,
          timeout: data.pingConfig.timeout || 5000,
          webhookUrl: data.pingConfig.webhookUrl,
        },
      });

      // 5. Criar PingConfig
      const pingConfig = await prisma.pingConfig.create({
        data: {
          monitoringId: monitoringConfig.id,
          ipAddress: data.pingConfig.ipAddress,
          packetSize: data.pingConfig.packetSize || 32,
          ttl: data.pingConfig.ttl || 64,
        },
      });

      return { service, monitoringConfig, pingConfig, usersToNotify: data.usersToNotify };
    });
  }

  /**
   * Busca todos os serviços ping
   */
  async findAllPingServices(): Promise<any[]> {
    return await this.prisma.service.findMany({
      where: {
        type: ServiceType.PING,
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

  /**
   * Busca um serviço ping específico
   */
  async findPingServiceById(id: number): Promise<any> {
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
            PingConfig: true,
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
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    return service;
  }

  /**
   * Atualiza dados do serviço ping
   */
  async updatePingService(serviceId: number, data: CreatePingServiceDto): Promise<any> {
    // Atualiza Service
    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        type: $Enums.ServiceType.PING,
      },
    });

    // Atualiza MonitoringConfig relacionado ao serviço
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId: serviceId },
    });

    if (monitoringConfig && data.pingConfig) {
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.pingConfig.interval,
          timeout: data.pingConfig.timeout,
          webhookUrl: data.pingConfig.webhookUrl,
        },
      });

      // Atualiza PingConfig relacionado ao MonitoringConfig
      await this.prisma.pingConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
          ipAddress: data.pingConfig.ipAddress,
          packetSize: data.pingConfig.packetSize,
          ttl: data.pingConfig.ttl,
        },
      });
    }

    // Retorna o serviço atualizado
    return await this.findPingServiceById(serviceId);
  }

  /**
   * Remove um serviço ping
   */
  async deletePingService(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de ping não encontrado');
      }
    });

    return service;
  }

  /**
   * Remove todos os serviços ping
   */
  async deleteAllPingServices(): Promise<any> {
    await this.prisma.metric.deleteMany({ where: { Service: { type: ServiceType.PING } } });
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.PING } });

    return result;
  }

  /**
   * Atualiza status do serviço
   */
  async updateServiceStatus(id: number, status: 'ACTIVE' | 'INACTIVE' | 'PAUSED'): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    await this.prisma.service.update({
      where: { id },
      data: { status },
    });

    return service;
  }

  /**
   * Atualiza status de health do serviço
   */
  async updateServiceHealthStatus(id: number, status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING'): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    await this.prisma.service.update({
      where: { id },
      data: { status },
    });

    return service;
  }

  /**
   * Atualiza CheckCle ID do serviço
   */
  async updateServiceCheckcleId(serviceId: number, checkcleId: string): Promise<void> {
    await this.prisma.service.update({
      where: { id: serviceId },
      data: { checkcleId }
    });
  }

  /**
   * Busca serviços que possuem CheckCle ID
   */
  async findServicesWithCheckcleId(): Promise<any[]> {
    return await this.prisma.service.findMany({
      where: { 
        type: ServiceType.PING,
        checkcleId: { not: null }
      },
      select: { id: true, checkcleId: true, name: true }
    });
  }
}
