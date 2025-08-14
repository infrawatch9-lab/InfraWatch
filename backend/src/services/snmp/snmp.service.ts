import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateSnmpConfigDto,
  SnmpServiceResponseDto,
  CreateServiceDto,
} from './snmp.entity';

@Injectable()
export class SnmpService {
    private readonly logger = new Logger(SnmpService.name);

    constructor(private readonly prisma: PrismaService) {}

async create(createServiceDto: CreateServiceDto) {
  try {
    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        type: createServiceDto.type,
        teamId: createServiceDto.teamId,
        SnmpConfig: createServiceDto.snmp
          ? {
              create: {
                host: createServiceDto.snmp.host,
                version: createServiceDto.snmp.version,
                community: createServiceDto.snmp.community,
                username: createServiceDto.snmp.username,
                authProtocol: createServiceDto.snmp.authProtocol,
                authPassword: createServiceDto.snmp.authPassword,
                privProtocol: createServiceDto.snmp.privProtocol,
                privPassword: createServiceDto.snmp.privPassword,
                oid: createServiceDto.snmp.oid,
                monitoringMode: createServiceDto.snmp.monitoringMode,
                cronExpression: createServiceDto.snmp.cronExpression,
                timezone: createServiceDto.snmp.timezone,
                agentVersion: createServiceDto.snmp.agentVersion,
                autoGenerate: createServiceDto.snmp.autoGenerate,
                interval: createServiceDto.snmp.interval,
                timeout: createServiceDto.snmp.timeout,
                retries: createServiceDto.snmp.retries,
                delay: createServiceDto.snmp.delay,
                alertAfterFailures: createServiceDto.snmp.alertAfterFailures,
                minAlertInterval: createServiceDto.snmp.minAlertInterval,
                expectedResponseTimeMs: createServiceDto.snmp.expectedResponseTimeMs
              }
            }
          : undefined
      },
      include: {
        SnmpConfig: true
      }
    });

    return service;
  } catch (error) {
    this.logger.error('Error creating service with SNMP config', error);
    throw new BadRequestException('Failed to create service with SNMP config');
  }
}

    async findAll(): Promise<SnmpServiceResponseDto[]> {
        const configs = await this.prisma.snmpConfig.findMany();
        return configs.map(config => ({ ...config }));
    }

    async findOne(id: number): Promise<SnmpServiceResponseDto> {
        const snmpConfig = await this.prisma.snmpConfig.findUnique({
            where: { id },
        });
        if (!snmpConfig) {
            throw new NotFoundException(`SNMP config with id ${id} not found`);
        }
        return { ...snmpConfig };
    }

    async update(id: number, updateSnmpDto: UpdateSnmpConfigDto): Promise<SnmpServiceResponseDto> {
        try {
            const snmpConfig = await this.prisma.snmpConfig.update({
                where: { id },
                data: { ...updateSnmpDto },
            });
            return { ...snmpConfig };
        } catch (error) {
            this.logger.error('Error updating SNMP config', error);
            throw new NotFoundException(`SNMP config with id ${id} not found`);
        }
    }

    async remove(id: number): Promise<SnmpServiceResponseDto> {
        try {
            const deleted = await this.prisma.snmpConfig.delete({
                where: { id },
            });
            return { ...deleted, version: deleted.version as SnmpServiceResponseDto['version'] };
        } catch (error) {
            this.logger.error('Error deleting SNMP config', error);
            throw new NotFoundException(`SNMP config with id ${id} not found`);
        }
    }

    async removeAll(): Promise<void> {
        await this.prisma.snmpConfig.deleteMany({});
    }
}
