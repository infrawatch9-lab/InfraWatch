import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CSVReportService } from './csv-report.service';
import { Public } from '../auth/public.decorator';

@Controller('sla/reports/export')
export class CSVReportController {
  constructor(private readonly csvService: CSVReportService) {}

  // Relatório geral CSV
  @Get('csv')
  @Public()
  async exportGeneralCSV(
    @Res() res: Response,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      console.log(`Gerando CSV geral, period: ${period}, startDate: ${startDate}, endDate: ${endDate}`);
      
      const csv = await this.csvService.generateGeneralCSVWithPeriod(
        period,
        startDate,
        endDate,
      );
      
      console.log(`CSV geral gerado com sucesso, tamanho: ${csv.length} caracteres`);
      
      // Nomenclatura: sla_geral.csv
      const fileName = 'sla_geral.csv';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    } catch (error) {
      console.error('Erro ao gerar CSV geral:', error);
      const err = error as any;
      
      if (err.message?.includes('Nenhum serviço cadastrado')) {
        res.status(400).json({ 
          message: 'Não é possível gerar relatório sem serviços cadastrados',
          error: err.message,
          details: 'Cadastre pelo menos um serviço antes de tentar gerar relatórios.'
        });
      } else if (err.message?.includes('Não foi possível calcular dados de SLA')) {
        res.status(400).json({ 
          message: 'Não foi possível calcular dados de SLA',
          error: err.message,
          details: 'Verifique se os serviços possuem métricas registradas.'
        });
      } else {
        res.status(500).json({ 
          message: 'Erro interno ao gerar relatório', 
          error: err.message
        });
      }
    }
  }

  // Relatório por tipo CSV
  @Get('csv/type/:type')
  @Public()
  async exportTypeCSV(
    @Param('type') type: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      console.log(`Gerando CSV para tipo: ${type}, startDate: ${startDate}, endDate: ${endDate}`);
      
      const csv = await this.csvService.generateTypeCSV(type, startDate, endDate);
      
      console.log(`CSV gerado com sucesso para tipo: ${type}, tamanho: ${csv.length} caracteres`);
      
      // Nomenclatura: sla_{tipo}_geral.csv
      const fileName = `sla_${type.toLowerCase()}_geral.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    } catch (error) {
      console.error(`Erro ao gerar CSV para tipo ${type}:`, error);
      const err = error as any;
      
      if (err.message?.includes('Nenhum serviço cadastrado')) {
        res.status(400).json({ 
          message: 'Não é possível gerar relatório sem serviços cadastrados',
          error: err.message,
          type: type,
          details: 'Cadastre pelo menos um serviço antes de tentar gerar relatórios.'
        });
      } else if (err.message?.includes(`Nenhum serviço do tipo "${type}"`)) {
        res.status(404).json({ 
          message: `Nenhum serviço do tipo "${type}" encontrado`,
          error: err.message,
          type: type,
          details: 'Verifique se existem serviços cadastrados deste tipo específico.'
        });
      } else if (err.message?.includes('Não foi possível calcular dados de SLA')) {
        res.status(400).json({ 
          message: 'Não foi possível calcular dados de SLA',
          error: err.message,
          type: type,
          details: 'Verifique se os serviços possuem métricas registradas.'
        });
      } else {
        res.status(500).json({ 
          message: 'Erro interno ao gerar relatório', 
          error: err.message,
          type: type
        });
      }
    }
  }

  // Relatório individual CSV
  @Get('csv/service/:serviceId')
  @Public()
  async exportServiceCSV(
    @Param('serviceId') serviceId: string,
    @Res() res: Response,
  ) {
    try {
      // Buscar o tipo do serviço para a nomenclatura
      const service = await (this.csvService as any).slaService.prisma.service.findUnique({
        where: { id: parseInt(serviceId, 10) },
        select: { type: true, name: true }
      });
      
      if (!service) {
        return res.status(404).json({ 
          message: 'Serviço não encontrado',
          serviceId: serviceId
        });
      }
      
      const csv = await this.csvService.generateServiceCSV(parseInt(serviceId));
      
      // Nomenclatura: sla_{tipo}.csv
      const fileName = `sla_${service.type.toLowerCase()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(csv);
    } catch (error) {
      console.error(`Erro ao gerar CSV para serviço ${serviceId}:`, error);
      const err = error as any;
      
      if (err.message?.includes('Serviço não encontrado')) {
        res.status(404).json({ 
          message: `Serviço não encontrado`,
          error: err.message,
          serviceId: serviceId,
          details: 'Verifique se o ID do serviço está correto.'
        });
      } else if (err.message?.includes('Não foi possível calcular dados de SLA')) {
        res.status(400).json({ 
          message: 'Não foi possível calcular dados de SLA para este serviço',
          error: err.message,
          serviceId: serviceId,
          details: 'Verifique se o serviço possui métricas registradas.'
        });
      } else {
        res.status(500).json({ 
          message: 'Erro interno ao gerar relatório', 
          error: err.message,
          serviceId: serviceId
        });
      }
    }
  }
}
