import { Injectable } from '@nestjs/common';
import { SlaService } from './sla.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PDFReportService {
  // Utilitário para gerar nomes de arquivos PDF simples e padronizados
  static getPDFFileName(
    type: 'general' | 'type' | 'service',
    opts?: {
      typeName?: string;
      serviceName?: string;
      start?: Date;
      end?: Date;
    },
  ): string {
    const date = (d: Date) => d.toISOString().slice(0, 10);
    if (type === 'general') {
      return `relatorio-sla-geral_${opts?.start ? date(opts.start) : ''}_${
        opts?.end ? date(opts.end) : ''
      }.pdf`;
    }
    if (type === 'type') {
      return `relatorio-sla-tipo-${opts?.typeName || 'tipo'}_${
        opts?.start ? date(opts.start) : ''
      }_${opts?.end ? date(opts.end) : ''}.pdf`;
    }
    if (type === 'service') {
      return `relatorio-sla-servico-${opts?.serviceName || 'servico'}_${
        opts?.start ? date(opts.start) : ''
      }_${opts?.end ? date(opts.end) : ''}.pdf`;
    }
    return 'relatorio-sla.pdf';
  }
  private readonly storageDir = path.join(
    process.cwd(),
    'storage',
    'pdf-reports',
  );

  constructor(private slaService: SlaService) {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  // Relatório geral de todos os serviços
  async generateGeneralPDF(
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const summaries = await this.slaService.getAllSLASummary();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Header institucional
    doc.rect(0, 0, 595, 70).fill('#1a237e');
    doc
      .fillColor('white')
      .fontSize(18)
      .text('RCS Angola', 60, 25, { continued: true })
      .fontSize(14)
      .text(' | Plataforma: InfraWatch', { continued: false, align: 'right' });
    doc.moveDown(2);
    doc
      .fillColor('#1a237e')
      .fontSize(22)
      .text('Relatório Geral de SLA', { align: 'center' });
    doc.fillColor('black');
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1a237e');
    doc.moveDown();

    if (!summaries.length) {
      doc
        .fontSize(16)
        .fillColor('red')
        .text('Nenhum serviço encontrado.', { align: 'center' })
        .fillColor('black');
    } else {
      // Cabeçalho da tabela
      doc.moveDown(0.5);
      doc
        .fontSize(13)
        .fillColor('#1a237e')
        .text('Serviço', 60, doc.y, { continued: true });
      doc.text('Disponibilidade', 200, doc.y, { continued: true });
      doc.text('Status', 320, doc.y, { continued: true });
      doc.text('SLA Alvo', 410, doc.y, { continued: true });
      doc.text('Último cálculo', 490, doc.y);
      doc.fillColor('black');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1a237e');
      doc.moveDown(0.2);
      // Linhas da tabela
      summaries.forEach((summary, idx) => {
        doc
          .fontSize(11)
          .fillColor(idx % 2 === 0 ? '#0d47a1' : '#1976d2')
          .rect(50, doc.y, 495, 18)
          .fill();
        doc
          .fillColor('white')
          .text(summary.serviceName, 60, doc.y + 3, { continued: true })
          .text(`${summary.currentAvailability}%`, 200, doc.y + 3, {
            continued: true,
          })
          .text(summary.status, 320, doc.y + 3, { continued: true })
          .text(`${summary.targetSLA}%`, 410, doc.y + 3, { continued: true })
          .text(
            new Date(summary.lastCalculated).toLocaleString(),
            490,
            doc.y + 3,
          );
        doc.moveDown(0.1);
      });
      doc.fillColor('black');
    }
    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));
    return Buffer.concat(buffers);
  }

  // Relatório por tipo de serviço
  async generateTypePDF(
    type: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const summaries = await this.slaService.getAllSLASummary();
    const filtered = summaries.filter(
      (s: any) => (s.serviceType || '').toLowerCase() === type.toLowerCase(),
    );
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Cabeçalho
    doc
      .fontSize(22)
      .fillColor('#1a237e')
      .text(`Relatório SLA - Tipo: ${type}`, { align: 'center' })
      .fillColor('black');
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    if (!filtered.length) {
      doc
        .fontSize(16)
        .fillColor('red')
        .text('Nenhum serviço deste tipo encontrado.', { align: 'center' })
        .fillColor('black');
    } else {
      doc.fontSize(14).text('Serviços:', { underline: true });
      doc.moveDown(0.5);
      filtered.forEach((summary, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${summary.serviceName}`);
        doc
          .fontSize(10)
          .text(
            `Disponibilidade: ${summary.currentAvailability}% | Status: ${
              summary.status
            } | SLA Alvo: ${summary.targetSLA}% | Último cálculo: ${new Date(
              summary.lastCalculated,
            ).toLocaleString()}`,
          );
        doc.moveDown(0.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .dash(1, { space: 2 })
          .stroke()
          .undash();
        doc.moveDown(0.5);
      });
    }
    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));
    return Buffer.concat(buffers);
  }

  // Relatório detalhado de um serviço específico
  async generateServicePDF(
    serviceId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const slaData = await this.slaService.calculateSLA(serviceId, start, end);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Cabeçalho
    doc
      .fontSize(22)
      .fillColor('#1a237e')
      .text(`Relatório SLA - Serviço: ${slaData.serviceName}`, {
        align: 'center',
      })
      .fillColor('black');
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Se não houver dados, exibe mensagem amigável
    if (slaData.message) {
      doc
        .fontSize(16)
        .fillColor('red')
        .text(slaData.message, { align: 'center' })
        .fillColor('black');
      doc.end();
      await new Promise<void>((resolve) => doc.on('end', resolve));
      return Buffer.concat(buffers);
    }

    // Seção de métricas principais
    doc.fontSize(16).text('Resumo do SLA', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Disponibilidade: ${slaData.availability}%`);
    doc
      .fontSize(12)
      .text(`Tempo médio de resposta: ${slaData.responseTime} ms`);
    doc.fontSize(12).text(`Uptime: ${slaData.uptime} h`);
    doc.fontSize(12).text(`Downtime: ${slaData.downtime} h`);
    doc.fontSize(12).text(`Total de verificações: ${slaData.totalChecks}`);
    doc.fontSize(12).text(`Falhas: ${slaData.failedChecks}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Seção de incidentes
    doc.fontSize(16).text('Incidentes', { underline: true });
    doc.moveDown(0.5);
    if (slaData.incidents.length === 0) {
      doc.fontSize(12).text('Nenhum incidente registrado no período.');
    } else {
      slaData.incidents.forEach((inc, idx) => {
        doc
          .fontSize(12)
          .text(
            `${idx + 1}. [${inc.severity}] ${inc.title} - ${new Date(
              inc.startTime,
            ).toLocaleString()} (${inc.status})`,
          );
      });
    }
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Seção de métricas detalhadas
    doc.fontSize(16).text('Métricas detalhadas', { underline: true });
    doc.moveDown(0.5);
    if (slaData.metrics.length === 0) {
      doc.fontSize(12).text('Nenhuma métrica registrada no período.');
    } else {
      // Exibe até 10 métricas para não poluir o PDF
      slaData.metrics.slice(0, 10).forEach((m, idx) => {
        doc
          .fontSize(10)
          .text(
            `${idx + 1}. ${new Date(m.timestamp).toLocaleString()} | Status: ${
              m.status
            } | Resp: ${m.responseTime}ms | CPU: ${m.cpuUsage ?? '-'} | Mem: ${
              m.memoryUsage ?? '-'
            }`,
          );
      });
      if (slaData.metrics.length > 10) {
        doc
          .fontSize(10)
          .text(`...e mais ${slaData.metrics.length - 10} registros.`);
      }
    }

    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));
    return Buffer.concat(buffers);
  }
}
