import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PDFReportService } from './pdf-report.service';
import { Public } from '../auth/public.decorator';

@Controller('sla/reports/export')
export class PDFReportController {
  constructor(private readonly pdfService: PDFReportService) {}

  // Relatório geral
  @Get('pdf')
  @Public()
  async exportGeneralPDF(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let buffer: Buffer;
    let fileName = PDFReportService.getPDFFileName('general', {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
    try {
      buffer = await this.pdfService.generateGeneralPDF_HTML(
        startDate,
        endDate,
      );
    } catch (e) {
      // fallback para PDFKit se Puppeteer falhar
      buffer = await this.pdfService.generateGeneralPDF(startDate, endDate);
      fileName = 'sla-report.pdf';
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  // Relatório por tipo
  @Get('pdf/type/:type')
  @Public()
  async exportTypePDF(
    @Param('type') type: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let buffer: Buffer;
    let fileName = PDFReportService.getPDFFileName('type', {
      typeName: type,
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
    try {
      // Se quiser HTML para tipo, crie generateTypePDF_HTML
      buffer = await this.pdfService.generateTypePDF(type, startDate, endDate);
    } catch (e) {
      buffer = await this.pdfService.generateTypePDF(type, startDate, endDate);
      fileName = `sla-report-type-${type}.pdf`;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  // Relatório por serviço específico
  @Get('pdf/service/:serviceId')
  @Public()
  async exportServicePDF(
    @Param('serviceId') serviceId: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let buffer: Buffer;
    let fileName = PDFReportService.getPDFFileName('service', {
      serviceName: serviceId,
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
    try {
      // Se quiser HTML para serviço, crie generateServicePDF_HTML
      buffer = await this.pdfService.generateServicePDF(
        parseInt(serviceId),
        startDate,
        endDate,
      );
    } catch (e) {
      buffer = await this.pdfService.generateServicePDF(
        parseInt(serviceId),
        startDate,
        endDate,
      );
      fileName = `sla-report-service-${serviceId}.pdf`;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
