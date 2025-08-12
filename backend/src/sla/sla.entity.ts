import { SLAStatus } from '@prisma/client';

export interface SLADto {
  serviceId: number;
  periodStart: Date;
  periodEnd: Date;
  targetUptime?: number; // Em porcentagem (ex: 99.9)
}

export interface SLAResponseDto {
  id: number;
  serviceId: number;
  periodStart: Date;
  periodEnd: Date;
  uptimePct: number;
  downtime: number; // Em minutos
  status: SLAStatus;
  service?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface SLACalculationDto {
  serviceId: number;
  periodStart: Date;
  periodEnd: Date;
  totalMinutes: number;
  downtimeMinutes: number;
  uptimePct: number;
  status: SLAStatus;
  incidents: IncidentDto[];
}

export interface IncidentDto {
  id: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // Em minutos
  severity: string;
  message: string;
  resolved: boolean;
}

export interface SLAReportDto {
  serviceId: number;
  serviceName: string;
  period: {
    start: Date;
    end: Date;
  };
  sla: {
    target: number;
    achieved: number;
    status: SLAStatus;
  };
  availability: {
    totalTime: number; // Em minutos
    uptime: number; // Em minutos
    downtime: number; // Em minutos
  };
  incidents: IncidentDto[];
  metrics: {
    mttr: number; // Mean Time To Recovery em minutos
    mtbf: number; // Mean Time Between Failures em minutos
    incidentCount: number;
  };
}

export interface SLASummaryDto {
  serviceId: number;
  serviceName: string;
  currentMonth: {
    uptimePct: number;
    status: SLAStatus;
    downtime: number;
  };
  last30Days: {
    uptimePct: number;
    status: SLAStatus;
    downtime: number;
  };
  last7Days: {
    uptimePct: number;
    status: SLAStatus;
    downtime: number;
  };
}

export interface CreateSLATargetDto {
  serviceId: number;
  targetUptime: number; // Em porcentagem
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export interface SLATrendDto {
  date: Date;
  uptimePct: number;
  downtime: number;
  incidentCount: number;
}
