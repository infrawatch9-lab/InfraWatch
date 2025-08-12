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

    // Buscar métricas do período
    const metrics = await this.prisma.metric.findMany({
      where: {
        serviceId: serviceId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

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

    // Calcular uptime e downtime em horas
    const totalHours =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const uptime = (availability / 100) * totalHours;
    const downtime = totalHours - uptime;

    // Simular incidentes (você pode implementar uma tabela de incidentes real)
    const incidents = this.generateMockIncidents(
      serviceId,
      startDate,
      endDate,
      failedChecks,
    );

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
      period: this.getPeriodString(startDate, endDate),
      startDate,
      endDate,
      incidents,
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
    const targetSLA = 99.9; // SLA alvo de 99.9%

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

  private generateMockIncidents(
    serviceId: number,
    startDate: Date,
    endDate: Date,
    failedChecks: number,
  ) {
    const incidents = [];

    if (failedChecks > 0) {
      const incidentCount = Math.min(failedChecks, 5); // Máximo 5 incidentes por relatório

      for (let i = 0; i < incidentCount; i++) {
        const incidentDate = new Date(
          startDate.getTime() +
            Math.random() * (endDate.getTime() - startDate.getTime()),
        );

        incidents.push({
          id: `INC-${Date.now()}-${i}`,
          title: `Indisponibilidade detectada em ${new Date(
            incidentDate,
          ).toLocaleString('pt-BR')}`,
          description:
            'Serviço apresentou falha de conectividade ou tempo de resposta elevado',
          severity: Math.random() > 0.7 ? 'high' : 'medium',
          startTime: incidentDate,
          endTime: new Date(
            incidentDate.getTime() + Math.random() * 30 * 60 * 1000,
          ), // 0-30 min
          status: 'resolved',
          impact:
            'Usuários podem ter experimentado lentidão ou indisponibilidade do serviço',
        });
      }
    }

    return incidents;
  }
}
