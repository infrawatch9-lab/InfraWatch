import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  SnmpDto,
} from './snmp.entity';
import { ServiceType, SnmpVersion } from '@prisma/client';
import { $Enums } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SnmpService {
    private readonly logger = new Logger(SnmpService.name);

    constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    ) {}

    async create(createServiceDto: SnmpDto): Promise<any> {
      try {
        const teamId = createServiceDto.teamId || 1;

        const checkIfServiceExists = await this.prisma.service.findFirst({
          where: {
            name: createServiceDto.name,
            type: ServiceType.SNMP,
          },
        });

        if (checkIfServiceExists) {
          this.logger.warn(`Service with name ${createServiceDto.name} already exists for team ID ${teamId}`);
          return { message: 'Service already exists' };
        }

        // 🔹 Transação só pros dados principais
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

          const monitoringConfig = await prisma.monitoringConfig.create({
            data: {
              serviceId: service.id,
              interval: createServiceDto.snmpConfig?.interval || 60,
              timeout: createServiceDto.snmpConfig?.timeout || 5000,
              webhookUrl: createServiceDto.snmpConfig?.webhookUrl || null,
            },
          });

          const snmpConfig = await prisma.snmpConfig.create({
            data: {
              monitoringId: monitoringConfig.id,
              host: createServiceDto.snmpConfig?.host || '',
              version: createServiceDto.snmpConfig?.version || SnmpVersion.v2c,
              community: createServiceDto.snmpConfig?.community || null,
              username: createServiceDto.snmpConfig?.username || null,
              authProtocol: createServiceDto.snmpConfig?.authProtocol || null,
              authPassword: createServiceDto.snmpConfig?.authPassword || null,
              privProtocol: createServiceDto.snmpConfig?.privProtocol || null,
              privPassword: createServiceDto.snmpConfig?.privPassword || null,
              oid: createServiceDto.snmpConfig?.oid || '',
              retries: createServiceDto.snmpConfig?.retries || null,
              delay: createServiceDto.snmpConfig?.delay || null,
              alertAfterFailures: createServiceDto.snmpConfig?.alertAfterFailures || null,
              minAlertInterval: createServiceDto.snmpConfig?.minAlertInterval || null,
              expectedResponseTimeMs: createServiceDto.snmpConfig?.expectedResponseTimeMs || null,
            },
          });

          return {
            service,
            monitoringConfig,
            snmpConfig,
            usersToNotify: createServiceDto.usersToNotify,
          };
        });

        if (createServiceDto.rules?.length) {
          await this.prisma.alertRule.createMany({
            data: createServiceDto.rules.map(rule => ({
              serviceId: result.service.id,
              field: rule.field,
              condition: rule.condition,
              severity: $Enums.AlertLevel[rule.severity as keyof typeof $Enums.AlertLevel],
              createdBy: rule.createdBy,
              active: rule.active ?? true,
            })),
          });
        }

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
    data: SnmpDto,
  ): Promise<any> {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { configs: true },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço de SNMP não encontrado');
    }

    // Preparar dados para atualizar o serviço principal (apenas campos fornecidos)
    const updateData: any = {
      type: ServiceType.SNMP,
    };

    // Incluir apenas campos que foram fornecidos
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.status) updateData.status = data.status;

    const service = await this.prisma.service.update({
        where: { id: serviceId },
        data: updateData,
    });

    // Atualiza MonitoringConfig relacionado ao serviço
    const monitoringConfig = await this.prisma.monitoringConfig.findFirst({
      where: { serviceId: serviceId },
    });

    if (monitoringConfig && data.snmpConfig) {
      await this.prisma.monitoringConfig.update({
        where: { id: monitoringConfig.id },
        data: {
          interval: data.snmpConfig.interval,
          timeout: data.snmpConfig.timeout,
          webhookUrl: data.snmpConfig.webhookUrl,
        },
      });

      // Atualiza SnmpConfig relacionado ao MonitoringConfig
      await this.prisma.snmpConfig.updateMany({
        where: { monitoringId: monitoringConfig.id },
        data: {
          monitoringId: monitoringConfig.id,
          host: data.snmpConfig?.host || '',
          version: data.snmpConfig?.version || SnmpVersion.v2c,
          community: data.snmpConfig?.community || null,
          username: data.snmpConfig?.username || null,
          authProtocol: data.snmpConfig?.authProtocol || null,
          authPassword: data.snmpConfig?.authPassword || null,
          privProtocol: data.snmpConfig?.privProtocol || null,
          privPassword: data.snmpConfig?.privPassword || null,
          oid: data.snmpConfig?.oid || '',
          retries: data.snmpConfig?.retries || null,
          delay: data.snmpConfig?.delay || null,
          alertAfterFailures: data.snmpConfig?.alertAfterFailures || null,
          minAlertInterval: data.snmpConfig?.minAlertInterval || null,
          expectedResponseTimeMs: data.snmpConfig?.expectedResponseTimeMs || null,
        },
      });
    }

    const updatedService = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        configs: {
          include: {
            SnmpConfig: true,
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

    // if (result.count === 0) {
    //   throw new NotFoundException('Nenhum serviço de SNMP encontrado para remover');
    // }

    return { message: 'Todos os serviços de SNMP foram removidos com sucesso' };
  }
}
