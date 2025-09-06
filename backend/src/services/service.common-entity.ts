import { ServiceStatus } from '@prisma/client';
import { $Enums } from '@prisma/client';
import { CreatePingServiceDto } from './ping/ping.entity';
import {  HttpDto } from './http/http.entity';
import {  WebhookDto } from './webhook/webhook.entity';
import {  SnmpDto} from './snmp/snmp.entity';

export class CreateAlertRuleDto {
  field!: string;
  condition!: string;
  severity!: $Enums.AlertLevel;
  createdBy!: number;
  active?: boolean = true;
}

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

export interface BaseServiceDto {
  name: string;
  description: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  teamId?: number;
  usersToNotify: string[];
  rules?: CreateAlertRuleDto[];
  monitoringConfig: MonitoringConfigDto;
}

export type CreateServiceDto =
  | CreatePingServiceDto
  | HttpDto
  | SnmpDto
  | WebhookDto;
