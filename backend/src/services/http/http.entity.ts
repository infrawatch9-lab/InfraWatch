import { ServiceType } from '@prisma/client';
import { $Enums } from '@prisma/client';

export class MonitoringConfigDto {
  interval: number = 60;
  timeout: number = 30;
  retries: number = 3;
  delay?: number;
  alertAfterFailures?: number;
  minAlertInterval?: number;

  cronExpression?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;

  webhookUrl?: string;
}

export class HttpConfigDto {
  endpoint!: string;
  method?: string = "GET";
  headers?: Record<string, string>;
  body?: Record<string, any>;

  authType?: "bearer" | "basic" | "none";
  authValue?: string;

  validateSSL?: boolean = true;
  followRedirects?: boolean = true;

  expectedStatus?: number;
  expectedBodyIncludes?: string;
  expectedResponseTimeMs?: number;
  expectedHeadersIncludes?: Record<string, string>;
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
  description?: string;
  type: ServiceType = ServiceType.HTTP;
  monitoringConfig!: MonitoringConfigDto;
  teamId?: number;
  rules!: CreateAlertRuleDto[];
  usersToNotify?: string[];
  httpConfig?: HttpConfigDto;
}



