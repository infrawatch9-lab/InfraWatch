import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '@prisma/client';
import {
  CreatePingServiceDto,
} from './ping.entity';
import { getDifferences } from './ping.utils';
import { $Enums } from '@prisma/client';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createPingService(
  data: CreatePingServiceDto,
  ): Promise<any> {
    try {
      const teamId = data.teamId || 1;
      
        const checkIfServiceExists = await this.prisma.service.findFirst({
        where: {
          name: data.name,
          type: ServiceType.PING,
          teamId: teamId,
        },
      });

      if (checkIfServiceExists) {
        this.logger.warn(`Service with name ${data.name} already exists for team ID ${teamId}`);
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
          name: data.name,
          description: data.description,
          type: ServiceType.PING,
          teamId: team.id,
        },
      });

      // Se vieram emails para notificação
      if (data.usersToNotify?.length) {
        const users = await prisma.user.findMany({
          where: { email: { in: data.usersToNotify } },
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

        return { service, monitoringConfig, pingConfig, usersToNotify: data.usersToNotify };
      });

      if (!result.service) {
        this.logger.warn('Serviço não foi criado corretamente.');
        return { message: 'Serviço não foi criado corretamente.' };
      }

      this.logger.log(`Serviço de ping criado: ${result.service.name}`);

      return {
        id: result.service.id,
        name: result.service.name,
        description: result.service.description,
        status: result.service.status,
        teamId: result.service.teamId,
        createdAt: result.service.createdAt,
        usersToNotify: result.usersToNotify,
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

  async findAll(): Promise<any[]> {
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

  async findOneEspecifico(
    id: number,
    includeRelations: string[] = [],
    configType?: string // opcional, para definir o tipo da config
  ): Promise<any> {
    const include: Record<string, any> = {};

    if (includeRelations.includes("usersToNotify")) {
      include.usersToNotify = { include: { User: true } };
    }

    if (includeRelations.includes("configs")) {
      include.configs = configType
        ? { include: { [configType]: true } } // ex: pingConfig
        : true; // se não passar tipo, traz todos
    }

    if (includeRelations.includes("rules")) include.rules = true;
    if (includeRelations.includes("alerts")) include.alerts = true;
    if (includeRelations.includes("metrics")) include.metrics = true;
    if (includeRelations.includes("slas")) include.slas = true;
    if (includeRelations.includes("logs")) include.logs = true;
    if (includeRelations.includes("Team")) include.Team = true;

    const service = await this.prisma.service.findUnique({
      where: { id },
      include,
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
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de ping não encontrado');
      }
    });
      return { message: 'Serviço de ping removido com sucesso' };
  }

  async removeAll(): Promise<any> {
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.PING } });

    if (result.count === 0) {
      throw new NotFoundException('Nenhum serviço de ping encontrado para remover');
    }

    return { message: 'Todos os serviços de ping foram removidos com sucesso' };
  }

}
