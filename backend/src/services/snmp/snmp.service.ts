import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateSnmpConfigDto,
  SnmpServiceResponseDto,
  CreateServiceDto,
  CreateSnmpConfigDto
} from './snmp.entity';
import { AlertLevel, ServiceType, SnmpVersion } from '@prisma/client';
import { $Enums } from '@prisma/client';

@Injectable()
export class SnmpService {
    private readonly logger = new Logger(SnmpService.name);

    constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto): Promise<any> {
    try {

      const teamId = createServiceDto.teamId || 1;

      const checkIfServiceExists = await this.prisma.service.findFirst({
        where: {
          name: createServiceDto.name,
          type: ServiceType.SNMP,
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
            type: ServiceType.SNMP,
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
            interval: createServiceDto.snmp?.interval || 60,
            timeout: createServiceDto.snmp?.timeout || 5000,
            webhookUrl: createServiceDto.snmp?.webhookUrl || null,
          },
        });

        // 3. Criar SNMP Config
        const snmpConfig = await prisma.snmpConfig.create({
        data: {
          monitoringId: monitoringConfig.id,
          host: createServiceDto.snmp?.host || '',
          version: createServiceDto.snmp?.version || SnmpVersion.v2c,
          community: createServiceDto.snmp?.community || null,
          username: createServiceDto.snmp?.username || null,
          authProtocol: createServiceDto.snmp?.authProtocol || null,
          authPassword: createServiceDto.snmp?.authPassword || null,
          privProtocol: createServiceDto.snmp?.privProtocol || null,
          privPassword: createServiceDto.snmp?.privPassword || null,
          oid: createServiceDto.snmp?.oid || '',
          retries: createServiceDto.snmp?.retries || null,
          delay: createServiceDto.snmp?.delay || null,
          alertAfterFailures: createServiceDto.snmp?.alertAfterFailures || null,
          minAlertInterval: createServiceDto.snmp?.minAlertInterval || null,
          expectedResponseTimeMs: createServiceDto.snmp?.expectedResponseTimeMs || null,
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
          snmpConfig,
          usersToNotify: createServiceDto.usersToNotify,
        };
      });

      
      return result;
    } catch (error) {
      this.logger.error('Error creating SNMP service', error);
      throw new NotFoundException('Error creating SNMP service');
    }
  }

    async findAll(): Promise<any[]> {
      const services = await this.prisma.service.findMany({
        where: {
          type: ServiceType.SNMP,
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
            SnmpConfig: true,
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
      throw new NotFoundException('Serviço de SNMP não encontrado');
    }

    return service;
  }

  async update(
    serviceId: number,
    data: CreateServiceDto,
  ): Promise<any> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço de SNMP não encontrado');
    }

    // Atualiza MonitoringConfig relacionado ao serviço
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId: serviceId },
    });

    if (monitoringConfig && data.snmp) {
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.snmp.interval,
          timeout: data.snmp.timeout,
          webhookUrl: data.snmp.webhookUrl,
        },
      });

      // Atualiza SnmpConfig relacionado ao MonitoringConfig
      await this.prisma.snmpConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
          monitoringId: monitoringConfig.id,
          host: data.snmp?.host || '',
          version: data.snmp?.version || SnmpVersion.v2c,
          community: data.snmp?.community || null,
          username: data.snmp?.username || null,
          authProtocol: data.snmp?.authProtocol || null,
          authPassword: data.snmp?.authPassword || null,
          privProtocol: data.snmp?.privProtocol || null,
          privPassword: data.snmp?.privPassword || null,
          oid: data.snmp?.oid || '',
          retries: data.snmp?.retries || null,
          delay: data.snmp?.delay || null,
          alertAfterFailures: data.snmp?.alertAfterFailures || null,
          minAlertInterval: data.snmp?.minAlertInterval || null,
          expectedResponseTimeMs: data.snmp?.expectedResponseTimeMs || null,
        },
      });
    }

    return this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            SnmpConfig: true,
          },
        },
        usersToNotify: {
          include: {
            User: true,
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

  async remove(id: number): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço de SNMP não encontrado');
    }

    await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.service.delete({ where: { id } });

      if (!result) {
        throw new NotFoundException('Serviço de SNMP não encontrado');
      }
    });
      return { message: 'Serviço de SNMP removido com sucesso' };
  }

  async removeAll(): Promise<any> {
    const result = await this.prisma.service.deleteMany({ where: { type: ServiceType.SNMP } });

    if (result.count === 0) {
      throw new NotFoundException('Nenhum serviço de SNMP encontrado para remover');
    }

    return { message: 'Todos os serviços de SNMP foram removidos com sucesso' };
  }
}
