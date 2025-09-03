import { Injectable } from '@nestjs/common';
import { SlaService } from './sla.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PDFReportService {
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
    doc.fontSize(20).text('Relatório Geral de SLA', { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    summaries.forEach((summary, idx) => {
      doc.fontSize(14).text(`${idx + 1}. ${summary.serviceName}`);
      doc.fontSize(11).text(`Disponibilidade: ${summary.currentAvailability}%`);
      doc.fontSize(11).text(`Status: ${summary.status}`);
      doc.fontSize(11).text(`SLA Alvo: ${summary.targetSLA}%`);
      doc
        .fontSize(11)
        .text(`Último cálculo: ${summary.lastCalculated.toLocaleString()}`);
      doc.moveDown();
    });
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
    doc.fontSize(20).text(`Relatório SLA - Tipo: ${type}`, { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    filtered.forEach((summary, idx) => {
      doc.fontSize(14).text(`${idx + 1}. ${summary.serviceName}`);
      doc.fontSize(11).text(`Disponibilidade: ${summary.currentAvailability}%`);
      doc.fontSize(11).text(`Status: ${summary.status}`);
      doc.fontSize(11).text(`SLA Alvo: ${summary.targetSLA}%`);
      doc
        .fontSize(11)
        .text(`Último cálculo: ${summary.lastCalculated.toLocaleString()}`);
      doc.moveDown();
    });
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
    doc.fontSize(20).text(`Relatório SLA - Serviço: ${slaData.serviceName}`, {
      align: 'center',
    });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    doc.fontSize(14).text(`Disponibilidade: ${slaData.availability}%`);
    doc.fontSize(14).text(`Tempo de resposta: ${slaData.responseTime}ms`);
    doc.fontSize(14).text(`Uptime: ${slaData.uptime}h`);
    doc.fontSize(14).text(`Downtime: ${slaData.downtime}h`);
    doc.fontSize(14).text(`Total de verificações: ${slaData.totalChecks}`);
    doc.fontSize(14).text(`Falhas: ${slaData.failedChecks}`);
    doc.fontSize(14).text(`Incidentes: ${slaData.incidents.length}`);
    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));
    return Buffer.concat(buffers);
  }
}
