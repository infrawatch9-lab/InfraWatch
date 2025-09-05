import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PDFReportService } from './pdf-report.service';
import { Public } from '../auth/public.decorator';

@Controller('sla/reports/export')
export class PDFReportController {
  constructor(private readonly pdfService: PDFReportService) {}

  // Relatório geral
  @Get('pdf')
  async exportGeneralPDF(
    @Res() res: Response,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const buffer = await this.pdfService.generateGeneralPDFWithPeriod(
        period,
        startDate,
        endDate,
      );
      
      // Para o nome do arquivo, usa as datas calculadas
      let start: Date | undefined;
      let end: Date | undefined;
      if (period) {
        const now = new Date();
        if (period === 'year')
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        else if (period === 'month')
          start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        else if (period === 'week')
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else start = startDate ? new Date(startDate) : undefined;
        end = endDate ? new Date(endDate) : now;
      } else {
        start = startDate ? new Date(startDate) : undefined;
        end = endDate ? new Date(endDate) : undefined;
      }
      // Nomenclatura: sla_geral.pdf
      const fileName = 'sla_geral.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
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

  // Relatório por tipo
  @Get('pdf/type/:type')
  async exportTypePDF(
    @Param('type') type: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const buffer = await this.pdfService.generateTypePDF(
        type,
        startDate,
        endDate,
      );
      
      // Nomenclatura: sla_{tipo}_geral.pdf
      const fileName = `sla_${type.toLowerCase()}_geral.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
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

    // Relatório individual
  @Get('pdf/service/:serviceId')
  async exportServicePDF(
    @Param('serviceId') serviceId: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      // Buscar o tipo do serviço para a nomenclatura
      const service = await (this.pdfService as any).slaService.prisma.service.findUnique({
        where: { id: parseInt(serviceId, 10) },
        select: { type: true, name: true }
      });
      
      if (!service) {
        return res.status(404).json({ 
          message: 'Serviço não encontrado',
          serviceId: serviceId
        });
      }
      
      const buffer = await this.pdfService.generateServicePDF(
        parseInt(serviceId, 10),
        startDate,
        endDate,
      );
      
      // Nomenclatura: sla_{tipo}.pdf
      const fileName = `sla_${service.type.toLowerCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
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
