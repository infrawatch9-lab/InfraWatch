import { Injectable } from '@nestjs/common';
import { PrismaClient, SLAStatus, ServiceStatus } from '@prisma/client';
import {
  SLADto,
  SLAResponseDto,
  SLACalculationDto,
  SLAReportDto,
  SLASummaryDto,
  IncidentDto,
  SLATrendDto,
} from './sla.entity';

const prisma = new PrismaClient();

@Injectable()
export class SlaService {
  async calculateSLA(data: SLADto): Promise<SLACalculationDto> {
    const { serviceId, periodStart, periodEnd } = data;

    // Converte para Date se necessário
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Busca todas as métricas do serviço no período
    const metrics = await prisma.metric.findMany({
      where: {
        serviceId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Busca alertas/incidentes do período
    const alerts = await prisma.alert.findMany({
      where: {
        serviceId,
        triggeredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        AlertRule: true,
      },
      orderBy: {
        triggeredAt: 'asc',
      },
    });

    // Calcula o tempo total do período em minutos
    const totalMinutes = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60),
    );

    // Calcula o downtime baseado nos alertas e métricas
    let downtimeMinutes = 0;
    const incidents: IncidentDto[] = [];

    // Agrupa alertas consecutivos em incidentes
    let currentIncident: any = null;

    for (const alert of alerts) {
      if (!alert.resolved && alert.AlertRule.severity === 'CRITICAL') {
        if (!currentIncident) {
          currentIncident = {
            id: alert.id,
            startTime: alert.triggeredAt,
            endTime: null,
            severity: alert.AlertRule.severity,
            message: alert.message,
            resolved: false,
          };
        }
      } else if (
        alert.resolved &&
        currentIncident &&
        !currentIncident.endTime
      ) {
        currentIncident.endTime = alert.triggeredAt;
        currentIncident.resolved = true;
        currentIncident.duration = Math.floor(
          (currentIncident.endTime.getTime() -
            currentIncident.startTime.getTime()) /
            (1000 * 60),
        );

        downtimeMinutes += currentIncident.duration;
        incidents.push(currentIncident);
        currentIncident = null;
      }
    }

    // Se há um incidente não resolvido, considera até o fim do período
    if (currentIncident) {
      currentIncident.endTime = endDate;
      currentIncident.duration = Math.floor(
        (currentIncident.endTime.getTime() -
          currentIncident.startTime.getTime()) /
          (1000 * 60),
      );
      downtimeMinutes += currentIncident.duration;
      incidents.push(currentIncident);
    }

    // Calcula uptime em porcentagem
    const uptimePct =
      totalMinutes > 0
        ? Math.max(0, ((totalMinutes - downtimeMinutes) / totalMinutes) * 100)
        : 100;

    // Determina status do SLA
    let status: SLAStatus = SLAStatus.OK;
    if (uptimePct < 99.0) {
      status = SLAStatus.VIOLATED;
    } else if (incidents.length > 0) {
      status = SLAStatus.UNKNOWN;
    }

    return {
      serviceId,
      periodStart: startDate,
      periodEnd: endDate,
      totalMinutes,
      downtimeMinutes,
      uptimePct: Math.round(uptimePct * 1000) / 1000, // 3 casas decimais
      status,
      incidents,
    };
  }

  async saveSLA(calculation: SLACalculationDto): Promise<SLAResponseDto> {
    const sla = await prisma.sLA.create({
      data: {
        serviceId: calculation.serviceId,
        periodStart: calculation.periodStart,
        periodEnd: calculation.periodEnd,
        uptimePct: calculation.uptimePct,
        downtime: calculation.downtimeMinutes,
        status: calculation.status,
      },
      include: {
        Service: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return {
      id: sla.id,
      serviceId: sla.serviceId,
      periodStart: sla.periodStart,
      periodEnd: sla.periodEnd,
      uptimePct: sla.uptimePct,
      downtime: sla.downtime,
      status: sla.status,
      service: sla.Service,
    };
  }

  async getSLAByService(
    serviceId: number,
    limit = 10,
  ): Promise<SLAResponseDto[]> {
    const slas = await prisma.sLA.findMany({
      where: { serviceId },
      include: {
        Service: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: limit,
    });

    return slas.map((sla) => ({
      id: sla.id,
      serviceId: sla.serviceId,
      periodStart: sla.periodStart,
      periodEnd: sla.periodEnd,
      uptimePct: sla.uptimePct,
      downtime: sla.downtime,
      status: sla.status,
      service: sla.Service,
    }));
  }

  async getSLAReport(
    serviceId: number,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SLAReportDto> {
    // Calcula SLA para o período
    const calculation = await this.calculateSLA({
      serviceId,
      periodStart,
      periodEnd,
    });

    // Busca informações do serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Calcula métricas MTTR e MTBF
    const resolvedIncidents = calculation.incidents.filter((i) => i.resolved);
    const mttr =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce(
            (sum, incident) => sum + incident.duration,
            0,
          ) / resolvedIncidents.length
        : 0;

    const totalUptime = calculation.totalMinutes - calculation.downtimeMinutes;
    const mtbf =
      resolvedIncidents.length > 0
        ? totalUptime / resolvedIncidents.length
        : totalUptime;

    return {
      serviceId,
      serviceName: service.name,
      period: {
        start: periodStart,
        end: periodEnd,
      },
      sla: {
        target: 99.9, // Padrão, pode ser configurável
        achieved: calculation.uptimePct,
        status: calculation.status,
      },
      availability: {
        totalTime: calculation.totalMinutes,
        uptime: calculation.totalMinutes - calculation.downtimeMinutes,
        downtime: calculation.downtimeMinutes,
      },
      incidents: calculation.incidents,
      metrics: {
        mttr: Math.round(mttr * 100) / 100,
        mtbf: Math.round(mtbf * 100) / 100,
        incidentCount: calculation.incidents.length,
      },
    };
  }

  async getSLASummary(serviceId: number): Promise<SLASummaryDto> {
    const now = new Date();

    // Primeiro dia do mês atual
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 30 dias atrás
    const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 7 dias atrás
    const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Busca informações do serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { name: true },
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Calcula SLA para cada período
    const currentMonth = await this.calculateSLA({
      serviceId,
      periodStart: currentMonthStart,
      periodEnd: now,
    });

    const last30Days = await this.calculateSLA({
      serviceId,
      periodStart: last30DaysStart,
      periodEnd: now,
    });

    const last7Days = await this.calculateSLA({
      serviceId,
      periodStart: last7DaysStart,
      periodEnd: now,
    });

    return {
      serviceId,
      serviceName: service.name,
      currentMonth: {
        uptimePct: currentMonth.uptimePct,
        status: currentMonth.status,
        downtime: currentMonth.downtimeMinutes,
      },
      last30Days: {
        uptimePct: last30Days.uptimePct,
        status: last30Days.status,
        downtime: last30Days.downtimeMinutes,
      },
      last7Days: {
        uptimePct: last7Days.uptimePct,
        status: last7Days.status,
        downtime: last7Days.downtimeMinutes,
      },
    };
  }

  async getSLATrend(serviceId: number, days = 30): Promise<SLATrendDto[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const trends: SLATrendDto[] = [];

    // Calcula SLA para cada dia no período
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Se o dia é no futuro, para o loop
      if (dayStart > endDate) break;

      const calculation = await this.calculateSLA({
        serviceId,
        periodStart: dayStart,
        periodEnd: dayEnd > endDate ? endDate : dayEnd,
      });

      trends.push({
        date: dayStart,
        uptimePct: calculation.uptimePct,
        downtime: calculation.downtimeMinutes,
        incidentCount: calculation.incidents.length,
      });
    }

    return trends;
  }

  async getAllServicesSLASummary(): Promise<SLASummaryDto[]> {
    // Busca todos os serviços ativos
    const services = await prisma.service.findMany({
      where: {
        status: {
          in: [ServiceStatus.UP, ServiceStatus.DOWN, ServiceStatus.DEGRADED],
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const summaries: SLASummaryDto[] = [];

    for (const service of services) {
      try {
        const summary = await this.getSLASummary(service.id);
        summaries.push(summary);
      } catch (error) {
        console.error(
          `Erro ao calcular SLA para serviço ${service.id}:`,
          error,
        );
        // Continua com o próximo serviço
      }
    }

    return summaries;
  }

  async processAutomaticSLA(): Promise<void> {
    console.log('Processando SLA automático...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayStart = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Busca todos os serviços ativos
    const services = await prisma.service.findMany({
      where: {
        status: {
          in: [ServiceStatus.UP, ServiceStatus.DOWN, ServiceStatus.DEGRADED],
        },
      },
    });

    for (const service of services) {
      try {
        // Verifica se já existe SLA para este dia
        const existingSLA = await prisma.sLA.findFirst({
          where: {
            serviceId: service.id,
            periodStart: dayStart,
            periodEnd: dayEnd,
          },
        });

        if (!existingSLA) {
          // Calcula e salva SLA para o dia anterior
          const calculation = await this.calculateSLA({
            serviceId: service.id,
            periodStart: dayStart,
            periodEnd: dayEnd,
          });

          await this.saveSLA(calculation);
          console.log(
            `SLA calculado para serviço ${
              service.name
            } - ${dayStart.toDateString()}`,
          );
        }
      } catch (error) {
        console.error(
          `Erro ao processar SLA para serviço ${service.id}:`,
          error,
        );
      }
    }

    console.log('Processamento de SLA automático concluído');
  }
}
