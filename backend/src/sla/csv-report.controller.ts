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
    // Nomenclatura: sla_geral.csv
    const fileName = 'sla_geral.csv';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
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
    // Nomenclatura: sla_geral_${type}.csv
    const fileName = `sla_geral_${type}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
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
      // Nomenclatura: sla_{nomeOuIdDoServico}.csv
      let serviceName = serviceId;
      try {
        const service = await (
          this.csvService as any
        ).slaService.prisma.service.findUnique({
          where: { id: parseInt(serviceId) },
          select: { name: true },
        });
        if (service?.name) serviceName = service.name.replace(/\s+/g, '_');
      } catch {}
      const fileName = `sla_${serviceName}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
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
