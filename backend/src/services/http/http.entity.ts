import { ServiceType } from '@prisma/client';
import {
  BaseServiceDto,
  BaseMonitoringConfigDto,
  ServiceHealthDto,
} from '../service.common-entity';

export interface CreateHttpServiceDto extends BaseServiceDto {
  endpoint: string;
  httpConfig: CreateHttpConfigDto;
}

// Aliases para compatibilidade
export interface CreateHttpDto extends CreateHttpServiceDto {}
export interface UpdateHttpDto extends UpdateHttpConfigDto {}

export interface CreateHttpConfigDto extends BaseMonitoringConfigDto {
  method?: string;
  headers?: string; // JSON string
  body?: string; // JSON string
  expectedStatusCodes?: string; // JSON array string
  followRedirects?: boolean;
  sslVerification?: boolean;
  basicAuth?: {
    username: string;
    password: string;
  };
  retries?: number;
  retryDelay?: number;
}

export interface UpdateHttpConfigDto extends Partial<CreateHttpConfigDto> {}

export interface HttpServiceResponseDto {
  id: number;
  name: string;
  description: string;
  endpoint: string;
  status: string;
  teamId: number;
  createdAt: Date;
  httpConfig: HttpConfigResponseDto;
}

export interface HttpConfigResponseDto {
  id: number;
  serviceId: number;
  method: string;
  headers?: string;
  body?: string;
  expectedStatusCodes?: string;
  followRedirects: boolean;
  sslVerification: boolean;
  timeout: number;
  frequency: number;
  retries?: number;
  retryDelay?: number;
  webhookUrl?: string;
}

export interface HttpTestDto {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  expectedStatusCodes?: number[];
}

export interface HttpTestResultDto {
  success: boolean;
  statusCode?: number;
  latency?: number;
  error?: string;
  url: string;
  timestamp: Date;
  responseHeaders?: Record<string, string>;
  responseSize?: number;
}

export interface HttpHealthDto extends ServiceHealthDto {
  metrics?: {
    httpStatus?: number;
    responseSize?: number;
    serverTiming?: Record<string, number>;
    contentType?: string;
    sslValid?: boolean;
    redirectCount?: number;
    [key: string]: any;
  };
}
