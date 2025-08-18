import { ServiceType, ServiceStatus } from '@prisma/client';

export interface MonitorResult {
  serviceId: number;
  status: ServiceStatus;
  latency?: number;
  errorMessage?: string;
  timestamp: Date;
  metrics?: {
    cpu?: number;
    memory?: number;
    pingLatency?: number;
    hostname?: string;
    errorCode?: string;
    [key: string]: any;
  };
}

export interface MonitorConfig {
  id: number;
  serviceId: number;
  type: ServiceType;
  endpoint: string;
  protocol: string;
  frequency: number;
  timeout: number;
  webhookUrl?: string;
}