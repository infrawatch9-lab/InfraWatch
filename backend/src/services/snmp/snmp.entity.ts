import { $Enums } from '@prisma/client';

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
    webhookUrl?: string | null; // Default value for webhookUrl
}

export class UpdateSnmpConfigDto {
    host?: string;
    version?: $Enums.SnmpVersion = $Enums.SnmpVersion.v2c; // Default value for version
    community?: string;
    username?: string;
    authProtocol?: string;
    authPassword?: string;
    privProtocol?: string;
    privPassword?: string;
    oid?: string;
    monitoringMode: $Enums.MonitoringMode = $Enums.MonitoringMode.cron; // Default value for monitoringMode
    cronExpression?: string;
    timezone?: string;
    agentVersion?: string;
    autoGenerate?: boolean;
    interval?: number;
    timeout?: number;
    retries?: number;
    delay?: number;
    alertAfterFailures?: number;
    minAlertInterval?: number;
    expectedResponseTimeMs?: number;
}

export class SnmpServiceResponseDto {
    id: number = 0; // Default value for id
    serviceId: number = 0; // Default value for serviceId
    host: string = ''; // Default value for host
    version: $Enums.SnmpVersion = $Enums.SnmpVersion.v2c; // Default value for version
    community?: string | null; // Default value for community
    username?: string | null; // Default value for username
    authProtocol?: string | null; // Default value for authProtocol
    authPassword?: string | null; // Default value for authPassword
    privProtocol?: string | null; // Default value for privProtocol
    privPassword?: string | null; // Default value for privPassword
    oid: string = ''; // Default value for oid
    monitoringMode: $Enums.MonitoringMode = $Enums.MonitoringMode.cron; // Default value for monitoringMode
    cronExpression?: string | null; // Default value for cronExpression
    timezone?: string | null; // Default value for timezone
    agentVersion?: string | null; // Default value for agentVersion
    autoGenerate?: boolean | null; // Default value for autoGenerate
    interval: number = 60; // Default value for interval
    timeout: number = 5000; // Default value for timeout
    retries?: number | null; // Default value for retries
    delay?: number | null; // Default value for delay
    alertAfterFailures?: number | null; // Default value for alertAfterFailures
    minAlertInterval?: number | null; // Default value for minAlertInterval
    expectedResponseTimeMs?: number | null; // Default value for expectedResponseTimeMs
    createdAt: Date = new Date(); // Default value for createdAt
    updatedAt: Date = new Date(); // Default value for updatedAt
}

export class SnmpTestDto {
    host: string = ''; // Default value for host
    version: $Enums.SnmpVersion = $Enums.SnmpVersion.v2c; // Default value for version
    community?: string | null;
    username?: string | null;
    authProtocol?: string | null;
    authPassword?: string | null;
    privProtocol?: string | null;
    privPassword?: string | null;
    oid: string = ''; // Default value for oid
    timeout?: number = 5000; // Default value for timeout
    retries?: number = 3; // Default value for retries
}

export class SnmpTestResultDto {
    success: boolean = false; // Default value for success
    responseTimeMs?: number = 0; // Default value for responseTimeMs
    value?: string = ''; // Default value for value
    error?: string = ''; // Default value for error
}

export class SnmpHealthDto {
    serviceId: number = 0; // Default value for serviceId
    healthy: boolean = false; // Default value for healthy
    lastCheckedAt: Date = new Date(); // Default value for lastCheckedAt
    responseTimeMs?: number = 0; // Default value for responseTimeMs
    error?: string = ''; // Default value for error
}

export class CreateAlertRuleDto {
  field!: string; // Ex: "latency", "cpu_usage", "memory_usage"
  condition!: string; // Ex: "> 200", "< 80"
  severity!: $Enums.AlertLevel; // INFO | WARNING | CRITICAL
  createdBy!: number;
  active?: boolean = true;
}

export class CreateServiceDto {
    name!: string;
    description?: string;
    type!: $Enums.ServiceType; // Default value for type
    teamId: number = 0; // Default value for teamId
    usersToNotify?: string[]; // Default value for usersToNotify
    snmp!: CreateSnmpConfigDto;
    rules!: CreateAlertRuleDto[];
    oid: string = ''; // Default value for oid
}