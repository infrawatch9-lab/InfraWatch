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

    // Verificar se há serviços cadastrados no sistema ANTES de tentar calcular SLA
    const totalServices = await (this.slaService as any).prisma.service.count();
    
    if (totalServices === 0) {
      throw new Error('Nenhum serviço cadastrado no sistema. Cadastre pelo menos um serviço antes de gerar relatórios.');
    }

    const summaries = await this.slaService.getAllSLASummary();
    
    // Se não conseguiu calcular SLA para nenhum serviço, ainda assim deve mostrar erro
    if (!summaries.length) {
      throw new Error('Não foi possível calcular dados de SLA para nenhum serviço. Verifique se os serviços possuem métricas registradas.');
    }

    return this.summariesToCSV(summaries, start, end);
  }

  async generateTypeCSV(
    type: string,
    period?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    let start: Date | undefined;
    let end: Date | undefined;
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
      start = startDate ? new Date(startDate) : undefined;
      end = endDate ? new Date(endDate) : undefined;
    }
    
    // Primeiro verificar se há serviços cadastrados no sistema
    const totalServices = await (this.slaService as any).prisma.service.count();
    
    if (totalServices === 0) {
      throw new Error('Nenhum serviço cadastrado no sistema. Cadastre pelo menos um serviço antes de gerar relatórios.');
    }
    
    // Buscar serviços do tipo específico primeiro
    const servicesOfType = await (this.slaService as any).prisma.service.findMany({
      where: { 
        type: type.toUpperCase() 
      },
      select: { id: true, name: true, type: true }
    });

    if (!servicesOfType.length) {
      throw new Error(`Nenhum serviço do tipo "${type}" encontrado no sistema. Tipos disponíveis podem ser consultados na listagem geral de serviços.`);
    }

    // Buscar dados de SLA para cada serviço do tipo
    const filtered: any[] = [];
    for (const service of servicesOfType) {
      try {
        const summary = await this.slaService.getSLASummary(service.id);
        filtered.push({
          ...summary,
          serviceType: service.type
        });
      } catch (error: any) {
        // Silently skip services that can't calculate SLA
      }
    }

    if (!filtered.length) {
      throw new Error(`Não foi possível calcular dados de SLA para nenhum serviço do tipo "${type}". Verifique se os serviços possuem métricas registradas.`);
    }

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
