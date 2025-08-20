import { $Enums } from '@prisma/client';
import { BaseServiceDto } from '../service.common-entity';

export class CreateSnmpConfigDto {
    host: string = '';
    version: $Enums.SnmpVersion = $Enums.SnmpVersion.v2c;
    community?: string;
    username?: string;
    authProtocol?: string;
    authPassword?: string;
    privProtocol?: string;
    privPassword?: string;
    oid: string = '';
    monitoringMode: $Enums.MonitoringMode = $Enums.MonitoringMode.cron;
    cronExpression?: string;
    timezone?: string;
    agentVersion?: string;
    autoGenerate?: boolean;
    interval: number = 60;
    timeout: number = 5000;
    retries?: number = 3;
    delay?: number = 1000;
    alertAfterFailures?: number;
    minAlertInterval?: number;
    expectedResponseTimeMs?: number;
    webhookUrl?: string | null;
}

export interface SnmpDto extends BaseServiceDto {
    type: 'SNMP';
    snmpConfig: CreateSnmpConfigDto;
}