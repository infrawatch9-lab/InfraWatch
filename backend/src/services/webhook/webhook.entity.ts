import { $Enums, ServiceType } from '@prisma/client';

export class MonitoringConfigDto {
  interval!: number;
  timeout!: number;
  retries?: number;
  delay?: number;
  alertAfterFailures?: number;
  minAlertInterval?: number;

  cronExpression?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;

  webhookUrl?: string;
}

export class WebhookConfigDto {
  endpoint!: string;
  method!: "GET" | "POST" | "PUT" | "DELETE";
  secret?: string;
  headers?: Record<string, string>;
}

export class CreateAlertRuleDto {
  field!: string;
  condition!: string;
  severity!: $Enums.AlertLevel;
  createdBy!: number;
  active?: boolean = true;
}

export class CreateServiceDto {
  name!: string;
  teamId!: number;
  description?: string;
  type: ServiceType = ServiceType.WEBHOOK;
  monitoringConfig!: MonitoringConfigDto;
  usersToNotify?: string[];
  rules?: CreateAlertRuleDto[];
  webhookConfig?: WebhookConfigDto;
}