import { $Enums, MonitoringMode } from '@prisma/client';
import {
  BaseServiceDto,
  BaseMonitoringConfigDto,
  ServiceHealthDto,
} from '../service.common-entity';

export interface CreatePingServiceDto extends BaseServiceDto {
  endpoint: string;
  pingConfig: CreatePingConfigDto;
  usersToNotify?: string[];
}

export interface ola {
  name: string;
  description: string;
  teamId?: number;
  endpoint?: string;
  emailsToNotify?: string[];
  pingConfig: {
    interval?: number;
    timeout?: number;
    webhookUrl?: string;
    ipAddress: string;
    packetSize?: number;
    ttl?: number;
  };
}

// Aliases para compatibilidade
export interface CreatePingDto extends CreatePingServiceDto {}
export interface UpdatePingDto extends UpdatePingConfigDto {}

export interface CreatePingConfigDto extends BaseMonitoringConfigDto {
  ipAddress: string;
  packetSize?: number;
  ttl?: number;
  cronExpression?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  agentVersion?: string;
  autoGenerate?: boolean;
  interval: number;
  retries?: number;
  delay?: number;
  alertAfterFailures?: number;
  minAlertInterval?: number;
}

export interface UpdatePingConfigDto extends Partial<CreatePingConfigDto> {}

export interface PingServiceResponseDto {
  id: number;
  name: string;
  description: string;
  status: string;
  teamId: number;
  createdAt: Date;
  pingConfig: PingConfigResponseDto;
}

export interface PingConfigResponseDto {
  id: number;
  serviceId: number;
  ipAddress: string;
  packetSize?: number;
  ttl?: number;
  cronExpression?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  agentVersion?: string;
  autoGenerate?: boolean;
  interval: number;
  timeout: number;
  retries?: number;
  delay?: number;
  alertAfterFailures?: number;
  minAlertInterval?: number;
  monitoringId?: number;
}

export interface PingTestDto {
  hostname: string;
  timeout?: number;
  retries?: number;
}

export interface PingTestResultDto {
  success: boolean;
  latency?: number;
  error?: string;
  hostname: string;
  timestamp: Date;
}

export interface PingHealthDto extends ServiceHealthDto {
  metrics?: {
    pingLatency?: number;
    hostname?: string;
    errorCode?: string;
    packetLoss?: number;
    jitter?: number;
  };
}

export class ResponseAllPingServicesDto {
    id!: number;
    name!: string;
    description!: string | null;
    status!: $Enums.ServiceStatus;
    teamId!: number;
    createdAt!: Date;
}