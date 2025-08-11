import { ServiceType, ServiceStatus, MonitoringMode } from '@prisma/client';

export interface BaseServiceDto {
  name: string;
  description?: string;
  type: ServiceType;
  teamId: number;
}

export interface ServiceResponseDto {
  id: number;
  name: string;
  description: string;
  type: ServiceType;
  status: ServiceStatus;
  teamId: number;
  createdAt: Date;
}

export interface BaseMonitoringConfigDto {
  frequency: number;
  timeout: number;
  webhookUrl?: string;
}

export interface ServiceHealthDto {
  serviceId: number;
  status: ServiceStatus;
  latency?: number;
  errorMessage?: string;
  timestamp: Date;
  metrics?: Record<string, any>;
}

export interface ServiceWithConfig {
  id: number;
  name: string;
  description: string;
  type: ServiceType;
  status: ServiceStatus;
  teamId: number;
  createdAt: Date;
  configs: any[];
  rules: any[];
  PingConfig?: any;
}

export interface CreateAlertRuleDto {
  field: string;
  condition: string;
  severity: string;
  active?: boolean;
}
