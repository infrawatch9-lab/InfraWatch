import { MonitoringMode } from '@prisma/client';
import {
  BaseServiceDto,
  BaseMonitoringConfigDto,
  ServiceHealthDto,
} from '../service.common-entity';

export interface CreatePingServiceDto extends BaseServiceDto {
  endpoint: string;
  pingConfig: CreatePingConfigDto;
}

// Aliases para compatibilidade
export interface CreatePingDto extends CreatePingServiceDto {}
export interface UpdatePingDto extends UpdatePingConfigDto {}

export interface CreatePingConfigDto extends BaseMonitoringConfigDto {
  ipAddress: string;
  packetSize?: number;
  ttl?: number;
  monitoringMode: MonitoringMode;
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
  endpoint: string;
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
  monitoringMode: MonitoringMode;
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
