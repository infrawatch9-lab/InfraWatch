import { Injectable } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SLASummary } from './sla.service';

@Injectable()
export class CSVReportService {
  constructor(private slaService: SlaService) {}

  async generateGeneralCSVWithPeriod(
    period?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    let start: Date;
    let end: Date;
    const now = new Date();
    if (period === 'year') {
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      end = now;
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      end = now;
    } else if (period === 'week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
    } else {
      start = startDate
        ? new Date(startDate)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : now;
    }
    const summaries = await this.slaService.getAllSLASummary();
    return this.summariesToCSV(summaries, start, end);
  }

  async generateTypeCSV(
    type: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const summaries = await this.slaService.getAllSLASummary();
    const filtered = summaries.filter(
      (s: any) => (s.serviceType || '').toLowerCase() === type.toLowerCase(),
    );
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.summariesToCSV(filtered, start, end);
  }

  async generateServiceCSV(serviceId: number): Promise<string> {
    // Verifica explicitamente se o serviço existe antes de gerar o CSV
    const service = await (this.slaService as any).prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });
    if (!service) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException('Serviço não encontrado');
    }
    let summary: SLASummary;
    try {
      summary = await this.slaService.getSLASummary(serviceId);
    } catch (error) {
      const err = error as any;
      if (err.message?.includes('Serviço não encontrado')) {
        const { NotFoundException } = await import('@nestjs/common');
        throw new NotFoundException('Serviço não encontrado');
      }
      throw error;
    }
    return this.summariesToCSV([summary]);
  }

  private summariesToCSV(
    summaries: SLASummary[],
    start?: Date,
    end?: Date,
  ): string {
    const header = [
      'Serviço',
      'Disponibilidade Atual',
      'SLA Alvo',
      'Status',
      'Disponibilidade Mensal',
      'Disponibilidade Semanal',
      'Disponibilidade Diária',
      'Último Cálculo',
    ];
    const rows = summaries.map((s) => [
      s.serviceName,
      s.currentAvailability,
      s.targetSLA,
      s.status,
      s.monthlyAvailability,
      s.weeklyAvailability,
      s.dailyAvailability,
      s.lastCalculated instanceof Date
        ? s.lastCalculated.toISOString()
        : s.lastCalculated,
    ]);
    return [header, ...rows].map((r) => r.join(',')).join('\n');
  }
}
