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

    // Buscar incidentes reais (Alertas) do banco de dados
    const incidents = await this.prisma.alert.findMany({
      where: {
        serviceId: serviceId,
        triggeredAt: {
          gte: start,
          lte: end,
        },
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
      incidents: incidents.map((a) => ({
        id: a.id,
        title: a.message,
        description: a.message,
        severity: a.AlertRule?.severity || 'unknown',
        startTime: a.triggeredAt,
        endTime: a.resolved ? a.triggeredAt : null,
        status: a.resolved ? 'resolved' : 'open',
        impact: '',
      })),
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
      select: { name: true, targetSLA: true },
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
    const targetSLA =
      typeof service.targetSLA === 'number' ? service.targetSLA : 99.9;

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
        console.warn(
          `Erro ao calcular SLA para serviço ${service.id}:`,
          error.message,
        );
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
