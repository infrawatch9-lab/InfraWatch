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
    // Nomenclatura: sla_giga_relatorio_geral.pdf
    const fileName = 'sla_relatorio_geral.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  // Relatório por tipo
  @Get('pdf/type/:type')
  async exportTypePDF(
    @Param('type') type: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.pdfService.generateTypePDF(
      type,
      startDate,
      endDate,
    );
    // Nomenclatura: sla_giga_relatorio_geral_{tipo}.pdf
    const fileName = `sla_relatorio_geral_${type}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  // Relatório por serviço específico
  @Get('pdf/service/:serviceId')
  async exportServicePDF(
    @Param('serviceId') serviceId: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.pdfService.generateServicePDF(
        parseInt(serviceId),
      );
      // Nomenclatura: sla_{nomeOuIdDoServico}_relatorio_individual.pdf
      // Tenta buscar o nome do serviço para usar no nome do arquivo
      let serviceName = serviceId;
      try {
        const service = await (
          this.pdfService as any
        ).slaService.prisma.service.findUnique({
          where: { id: parseInt(serviceId) },
          select: { name: true },
        });
        if (service?.name) serviceName = service.name.replace(/\s+/g, '_');
      } catch {}
      const fileName = `sla_${serviceName}_relatorio_individual.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      const err = error as any;
      if (
        err.name === 'NotFoundException' ||
        err.message?.includes('Serviço não encontrado')
      ) {
        res.status(404).json({ message: 'Serviço não encontrado' });
      } else {
        res
          .status(500)
          .json({ message: 'Erro ao gerar relatório', error: err.message });
      }
    }
  }
}
