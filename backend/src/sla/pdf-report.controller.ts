import { Controller, Get, Post, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { PDFReportService } from './pdf-report.service';
import { Public } from '../auth/public.decorator';

@Controller('sla/reports')
export class PDFReportController {
  constructor(private readonly pdfService: PDFReportService) {}

  @Post('generate/:serviceId')
  @Public()
  async generateReport(
    @Param('serviceId') serviceId: string,
    @Query('period') period?: string,
  ) {
    try {
      const filename = await this.pdfService.generateAndSavePDF(
        parseInt(serviceId),
        period,
      );

      return {
        success: true,
        message: 'Relatório PDF gerado com sucesso',
        filename,
        downloadUrl: `/sla/reports/download/${filename}`,
        viewUrl: `/sla/reports/view/${filename}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao gerar relatório PDF',
        error: error.message,
      };
    }
  }

  @Get('list')
  @Public()
  async listReports() {
    try {
      const reports = await this.pdfService.listSavedReports();

      return {
        success: true,
        reports: reports.map((report) => ({
          filename: report.filename,
          createdAt: report.createdAt,
          fileSize: `${(report.size / 1024).toFixed(2)} KB`,
          downloadUrl: `/sla/reports/download/${report.filename}`,
          viewUrl: `/sla/reports/view/${report.filename}`,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao listar relatórios',
        error: error.message,
      };
    }
  }

  @Get('download/:filename')
  @Public()
  async downloadReport(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const fileBuffer = await this.pdfService.getReportFile(filename);

      if (!fileBuffer) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado',
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao baixar arquivo',
        error: error.message,
      });
    }
  }

  @Get('view/:filename')
  @Public()
  async viewReport(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const fileBuffer = await this.pdfService.getReportFile(filename);

      if (!fileBuffer) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado',
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao visualizar arquivo',
        error: error.message,
      });
    }
  }

  @Get('delete/:filename')
  @Public()
  async deleteReport(@Param('filename') filename: string) {
    try {
      const deleted = await this.pdfService.deleteReport(filename);

      if (deleted) {
        return {
          success: true,
          message: 'Relatório deletado com sucesso',
        };
      } else {
        return {
          success: false,
          message: 'Arquivo não encontrado',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar relatório',
        error: error.message,
      };
    }
  }

  @Get('demo')
  @Public()
  async generateDemoReport() {
    try {
      const filename = await this.pdfService.generateDemoPDF();

      return {
        success: true,
        message: 'Relatório demo gerado com sucesso',
        filename,
        downloadUrl: `/sla/reports/download/${filename}`,
        viewUrl: `/sla/reports/view/${filename}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao gerar relatório demo',
        error: error.message,
      };
    }
  }

  @Get('demo-pdf')
  @Public()
  async downloadDemoReport(@Res() res: Response) {
    try {
      const filename = await this.pdfService.generateDemoPDF();
      const fileBuffer = await this.pdfService.getReportFile(filename);

      if (!fileBuffer) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao gerar arquivo demo',
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="demo-sla-report.pdf"`,
      );
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório demo',
        error: error.message,
      });
    }
  }
}
