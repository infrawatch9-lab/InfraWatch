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
    const buffer = await this.pdfService.generateGeneralPDF(startDate, endDate);
    const fileName = PDFReportService.getPDFFileName('general', {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
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
    const buffer = await this.pdfService.generateTypePDF(
      type,
      startDate,
      endDate,
    );
    const fileName = PDFReportService.getPDFFileName('type', {
      typeName: type,
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
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
    const buffer = await this.pdfService.generateServicePDF(
      parseInt(serviceId),
      startDate,
      endDate,
    );
    const fileName = PDFReportService.getPDFFileName('service', {
      serviceName: serviceId,
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
