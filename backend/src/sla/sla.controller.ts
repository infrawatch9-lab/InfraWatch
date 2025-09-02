import PDFDocument from 'pdfkit';
import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Parser as Json2csvParser } from 'json2csv';
import { SlaService } from './sla.service';
import { Public } from '../auth/public.decorator';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('export/pdf')
  @Public()
  async exportAllSLASummaryPDF(@Res() res: Response): Promise<void> {
    const summaries = await this.slaService.getAllSLASummary();
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sla-summary.pdf"',
    );
    doc.pipe(res);
    doc.fontSize(18).text('Relatório Geral de SLA', { align: 'center' });
    doc.moveDown();
    summaries.forEach((summary: any, idx: number) => {
      doc
        .fontSize(12)
        .text(`Serviço: ${summary.serviceName} (ID: ${summary.serviceId})`);
      doc.text(`Disponibilidade Atual: ${summary.currentAvailability}%`);
      doc.text(`SLA Alvo: ${summary.targetSLA}%`);
      doc.text(`Status: ${summary.status}`);
      doc.text(`Disponibilidade Mensal: ${summary.monthlyAvailability}%`);
      doc.text(`Disponibilidade Semanal: ${summary.weeklyAvailability}%`);
      doc.text(`Disponibilidade Diária: ${summary.dailyAvailability}%`);
      doc.text(
        `Último Cálculo: ${new Date(summary.lastCalculated).toLocaleString(
          'pt-BR',
        )}`,
      );
      if (idx < summaries.length - 1) doc.moveDown();
    });
    doc.end();
  }

  @Get('export/csv')
  @Public()
  async exportAllSLASummaryCSV(@Res() res: Response) {
    const summaries = await this.slaService.getAllSLASummary();
    const fields = [
      'serviceId',
      'serviceName',
      'currentAvailability',
      'targetSLA',
      'status',
      'monthlyAvailability',
      'weeklyAvailability',
      'dailyAvailability',
      'lastCalculated',
    ];
    const json2csv = new Json2csvParser({ fields });
    const csv = json2csv.parse(summaries);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sla-summary.csv"',
    );
    res.send(csv);
  }

  @Post('calculate')
  @Public()
  async calculateSLA(
    @Body() body: { serviceId: number; startDate: string; endDate: string },
  ) {
    const { serviceId, startDate, endDate } = body;
    return await this.slaService.calculateSLA(
      serviceId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('summary/:serviceId')
  @Public()
  async getSLASummary(@Param('serviceId') serviceId: string) {
    return await this.slaService.getSLASummary(parseInt(serviceId));
  }

  @Get('summary')
  @Public()
  async getAllSLASummary() {
    return await this.slaService.getAllSLASummary();
  }

  @Get('today/:serviceId')
  @Public()
  async getTodaySLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getTodaySLA(parseInt(serviceId));
  }

  @Get('current-month/:serviceId')
  @Public()
  async getCurrentMonthSLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getCurrentMonthSLA(parseInt(serviceId));
  }

  @Get('last-week/:serviceId')
  @Public()
  async getLastWeekSLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getLastWeekSLA(parseInt(serviceId));
  }
}
