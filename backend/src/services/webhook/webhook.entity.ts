import { $Enums, ServiceType } from '@prisma/client';
import { BaseServiceDto } from '../service.common-entity';

export class WebhookConfigDto {
  endpoint!: string;
  method!: "GET" | "POST" | "PUT" | "DELETE";
  secret?: string;
  headers?: Record<string, string>;
  provedor!: string;
}

export interface WebhookDto extends BaseServiceDto {
  type: 'WEBHOOK';
  webhookConfig?: WebhookConfigDto;
}