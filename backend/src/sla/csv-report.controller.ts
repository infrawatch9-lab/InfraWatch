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
    const csv = await this.csvService.generateGeneralCSVWithPeriod(
      period,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="relatorio-sla-geral.csv"',
    );
    res.send(csv);
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
    const csv = await this.csvService.generateTypeCSV(type, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-sla-tipo-${type}.csv"`,
    );
    res.send(csv);
  }

  // Relatório individual CSV
  @Get('csv/service/:serviceId')
  @Public()
  async exportServiceCSV(
    @Param('serviceId') serviceId: string,
    @Res() res: Response,
  ) {
    try {
      const csv = await this.csvService.generateServiceCSV(parseInt(serviceId));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-sla-servico-${serviceId}.csv"`,
      );
      res.send(csv);
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
