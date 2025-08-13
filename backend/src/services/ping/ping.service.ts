import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '@prisma/client';
import {
  CreatePingServiceDto,
  PingServiceResponseDto,
  ResponseAllPingServicesDto,
  ola,
} from './ping.entity';
import { getDifferences } from './ping.utils';
import { $Enums } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPingService(
  data: ola,
  ): Promise<PingServiceResponseDto> {
    try {
      const teamId = data.teamId || 1;
      
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
          name: data.name,
          description: data.description,
          type: ServiceType.PING,
          teamId: team.id,
        },
      });

      // Se vieram emails para notificação
      if (data.emailsToNotify?.length) {
        const users = await prisma.user.findMany({
          where: { email: { in: data.emailsToNotify } },
          select: { id: true },
        });

        if (users.length) {
          await prisma.serviceUserNotification.createMany({
            data: users.map(u => ({
              serviceId: service.id,
              userId: u.id,
            })),
          });
        }
      }

      // 2. Criar MonitoringConfig
      const monitoringConfig = await prisma.monitoringConfig.create({
        data: {
          serviceId: service.id,
          interval: data.pingConfig.interval || 60,
          timeout: data.pingConfig.timeout || 5000,
          webhookUrl: data.pingConfig.webhookUrl,
        },
      });

      // 3. Criar PingConfig
      const pingConfig = await prisma.pingConfig.create({
        data: {
          monitoringId: monitoringConfig.id,
          ipAddress: data.pingConfig.ipAddress,
          packetSize: data.pingConfig.packetSize || 32,
          ttl: data.pingConfig.ttl || 64,
        },
      });

        return { service, monitoringConfig, pingConfig };
      });

      this.logger.log(`Serviço de ping criado: ${result.service.name}`);

      return {
        id: result.service.id,
        name: result.service.name,
        description: result.service.description,
        // endpoint: data.endpoint,
        status: result.service.status,
        teamId: result.service.teamId,
        createdAt: result.service.createdAt,
        pingConfig: {
          id: result.pingConfig.id,
          serviceId: result.monitoringConfig.serviceId,
          interval: result.monitoringConfig.interval,
          timeout: result.monitoringConfig.timeout,
          monitoringId: result.pingConfig.monitoringId,
          ipAddress: result.pingConfig.ipAddress,
          packetSize: result.pingConfig.packetSize || undefined,
          ttl: result.pingConfig.ttl || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao criar serviço de ping:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponseAllPingServicesDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        type: ServiceType.PING,
      },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
    } as ResponseAllPingServicesDto));
  }


  async findOne(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        usersToNotify: {},
        configs: {},
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    return service;
  }

  async update(
    serviceId: number,
    data: CreatePingServiceDto,
  ): Promise<any> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

    const differences = getDifferences(existingService, data);
    
    console.log("Existente");
    console.table(`{existingService: ${JSON.stringify(existingService)}, data: ${JSON.stringify(data)}}`);
    
    console.log("Actualizacoes");
    console.table(`Differences: ${JSON.stringify(data)}`);
    if (differences.length === 0) {
      this.logger.log('Nenhuma diferença encontrada.');
      return existingService;
    }

    this.logger.log(`Diferenças encontradas: ${differences.join(', ')}`);

    // Atualiza Service, MonitoringConfig e PingConfig separadamente
    const updatedService = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        type: $Enums.ServiceType.PING,
        teamId: data.teamId,
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

    // Retorna o serviço atualizado (pode ser expandido para incluir configs se necessário)
    return updatedService;
  }

  async remove(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de ping não encontrado');
    }

  await this.prisma.$transaction(async (prisma) => {
    const monitoringConfigs = await prisma.monitoringConfig.findMany({
      where: { serviceId: id },
      select: { id: true }
    });

    await prisma.pingConfig.deleteMany({
      where: { monitoringId: { in: monitoringConfigs.map(c => c.id) } }
    });

    await prisma.monitoringConfig.deleteMany({
      where: { serviceId: id },
    });

    await prisma.service.delete({
      where: { id },
    });
  });
    return { message: 'Serviço de ping removido com sucesso' };
  }

  async removeAll(): Promise<any> {
    const services = await this.prisma.service.findMany({
      where: { type: ServiceType.PING },
    });

    if (services.length === 0) {
      throw new NotFoundException('Nenhum serviço de ping encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      for (const service of services) {
        const monitoringConfigs = await prisma.monitoringConfig.findMany({
          where: { serviceId: service.id },
          select: { id: true }
        });

        await prisma.pingConfig.deleteMany({
          where: { monitoringId: { in: monitoringConfigs.map(c => c.id) } }
        });

        await prisma.monitoringConfig.deleteMany({
          where: { serviceId: service.id },
        });
      }

      await prisma.service.deleteMany({
        where: { type: ServiceType.PING },
      });
    });

    return { message: 'Todos os serviços de ping foram removidos com sucesso' };
  }
}
