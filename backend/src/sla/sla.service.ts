import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface SLACalculationResult {
  serviceId: number;
  serviceName: string;
  availability: number;
  responseTime: number;
  uptime: number;
  downtime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  period: string;
  startDate: Date;
  endDate: Date;
  incidents: any[];
  metrics: any[];
  message?: string; // mensagem opcional para ausência de dados
}

export interface SLASummary {
  serviceId: number;
  serviceName: string;
  currentAvailability: number;
  targetSLA: number;
  status: 'meeting' | 'at-risk' | 'breached';
  monthlyAvailability: number;
  weeklyAvailability: number;
  dailyAvailability: number;
  lastCalculated: Date;
}

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async calculateSLA(
    serviceId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<SLACalculationResult> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Corrigir datas invertidas
    let start = startDate;
    let end = endDate;
    if (start > end) {
      [start, end] = [end, start];
    }

    // Buscar métricas do período
    const metrics = await this.prisma.metric.findMany({
      where: {
        serviceId: serviceId,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Se não houver métricas, retornar mensagem amigável
    if (!metrics.length) {
      return {
        serviceId,
        serviceName: service.name,
        availability: 0,
        responseTime: 0,
        uptime: 0,
        downtime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        period: this.getPeriodString(start, end),
        startDate: start,
        endDate: end,
        incidents: [],
        metrics: [],
        message: 'Sem dados para o período selecionado.',
      };
    }

    // Calcular estatísticas
    const totalChecks = metrics.length;
    const successfulChecks = metrics.filter(
      (m: any) => m.status === 'ACTIVE',
    ).length;
    const failedChecks = totalChecks - successfulChecks;
    const availability =
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    // Calcular tempo de resposta médio (usando latency)
    const responseTimes = metrics
      .filter((m: any) => m.latency > 0)
      .map((m: any) => m.latency);
    const responseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) /
          responseTimes.length
        : 0;

    // Calcular uptime e downtime em horas (nunca negativos)
    const totalHours = Math.max(
      0,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    );
    const uptime = Math.max(0, (availability / 100) * totalHours);
    const downtime = Math.max(0, totalHours - uptime);

    // Buscar incidentes reais do SystemLog (não apenas alertas)
    const systemIncidents = await this.prisma.systemLog.findMany({
      where: {
        serviceId: serviceId,
        type: 'ERROR', // Incidentes são erros do sistema
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        message: true,
        type: true,
      },
    });

    // Buscar também alertas críticos como incidentes
    const criticalAlerts = await this.prisma.alert.findMany({
      where: {
        serviceId: serviceId,
        triggeredAt: {
          gte: start,
          lte: end,
        },
        AlertRule: {
          severity: {
            in: ['HIGH', 'CRITICAL']
          }
        }
      },
      orderBy: { triggeredAt: 'asc' },
      select: {
        id: true,
        triggeredAt: true,
        message: true,
        resolved: true,
        ruleId: true,
        AlertRule: { select: { severity: true } },
      },
    });

    // Combinar incidentes do sistema e alertas críticos
    const allIncidents = [
      ...systemIncidents.map((incident) => ({
        id: `sys_${incident.id}`,
        title: incident.message,
        description: incident.message,
        severity: 'SYSTEM_ERROR',
        startTime: incident.timestamp,
        endTime: null,
        status: 'logged',
        impact: 'System incident',
        source: 'system_log'
      })),
      ...criticalAlerts.map((alert) => ({
        id: `alert_${alert.id}`,
        title: alert.message,
        description: alert.message,
        severity: alert.AlertRule?.severity || 'unknown',
        startTime: alert.triggeredAt,
        endTime: alert.resolved ? alert.triggeredAt : null,
        status: alert.resolved ? 'resolved' : 'open',
        impact: 'Service alert',
        source: 'alert'
      }))
    ];

    // Ordenar todos os incidentes por data
    allIncidents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
      serviceId,
      serviceName: service.name,
      availability: Math.round(availability * 100) / 100,
      responseTime: Math.round(responseTime * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      downtime: Math.round(downtime * 100) / 100,
      totalChecks,
      successfulChecks,
      failedChecks,
      period: this.getPeriodString(start, end),
      startDate: start,
      endDate: end,
      incidents: allIncidents,
      metrics: metrics.map((m: any) => ({
        timestamp: m.timestamp,
        status: m.status,
        responseTime: m.latency,
        cpuUsage: m.cpu,
        memoryUsage: m.memory,
      })),
    };
  }

  async getSLASummary(serviceId: number): Promise<SLASummary> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calcular SLA diário, semanal e mensal
    const dailySLA = await this.calculateSLA(serviceId, today, now);
    const weeklySLA = await this.calculateSLA(serviceId, thisWeek, now);
    const monthlySLA = await this.calculateSLA(serviceId, thisMonth, now);

    const currentAvailability = monthlySLA.availability;
    const targetSLA = (service as any).targetSLA ?? 99.9;

    let status: 'meeting' | 'at-risk' | 'breached';
    if (currentAvailability >= targetSLA) {
      status = 'meeting';
    } else if (currentAvailability >= targetSLA - 0.5) {
      status = 'at-risk';
    } else {
      status = 'breached';
    }

    return {
      serviceId,
      serviceName: service.name,
      currentAvailability,
      targetSLA,
      status,
      monthlyAvailability: monthlySLA.availability,
      weeklyAvailability: weeklySLA.availability,
      dailyAvailability: dailySLA.availability,
      lastCalculated: now,
    };
  }

  async getAllSLASummary(): Promise<SLASummary[]> {
    const services = await this.prisma.service.findMany();
    const summaries: SLASummary[] = [];

    for (const service of services) {
      try {
        const summary = await this.getSLASummary(service.id);
        summaries.push(summary);
      } catch (error: any) {
        // Se não conseguir calcular SLA para um serviço, continua com os outros
        // Silently skip services that can't calculate SLA
      }
    }

    return summaries;
  }

  async getTodaySLA(serviceId: number): Promise<SLACalculationResult> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return await this.calculateSLA(serviceId, startOfDay, today);
  }

  async getCurrentMonthSLA(serviceId: number): Promise<SLACalculationResult> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return await this.calculateSLA(serviceId, startOfMonth, now);
  }

  async getLastWeekSLA(serviceId: number): Promise<SLACalculationResult> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return await this.calculateSLA(serviceId, lastWeek, now);
  }

  private getPeriodString(startDate: Date, endDate: Date): string {
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) return 'daily';
    if (daysDiff <= 7) return 'weekly';
    return 'monthly';
  }
}
