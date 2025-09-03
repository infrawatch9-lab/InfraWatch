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

  // Relatório geral de todos os serviços (PDFKit puro, estilização máxima)
  async generateGeneralPDF(
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const summaries = await this.slaService.getAllSLASummary();
    // Buscar tipos de serviço para cada summary
    const serviceTypes: Record<number, string> = {};
    try {
      const services = await (this.slaService as any).prisma.service.findMany({
        select: { id: true, type: true },
      });
      for (const s of services) serviceTypes[s.id] = s.type;
    } catch {}
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Header institucional com fonte elegante
    try {
      doc.registerFont(
        'Montserrat',
        path.join(__dirname, '../../fonts/Montserrat-Bold.ttf'),
      );
      doc.registerFont(
        'Montserrat-Regular',
        path.join(__dirname, '../../fonts/Montserrat-Regular.ttf'),
      );
      doc
        .font('Montserrat')
        .fontSize(24)
        .fillColor('#1a237e')
        .text('RCS Angola', 50, 30, { continued: true });
      doc
        .font('Montserrat-Regular')
        .fontSize(16)
        .fillColor('#1976d2')
        .text(' | Plataforma: InfraWatch', {
          continued: false,
          align: 'right',
        });
    } catch (e) {
      doc
        .fontSize(24)
        .fillColor('#1a237e')
        .text('RCS Angola', 50, 30, { continued: true });
      doc.fontSize(16).fillColor('#1976d2').text(' | Plataforma: InfraWatch', {
        continued: false,
        align: 'right',
      });
    }
    doc.moveDown(1.5);
    doc
      .fontSize(22)
      .fillColor('#1a237e')
      .text('Relatório Geral de SLA', { align: 'center' });
    doc.fillColor('black');
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Período: ${start.toLocaleDateString()} até ${end.toLocaleDateString()}`,
      );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1976d2');
    doc.moveDown();

    if (!summaries.length) {
      doc
        .fontSize(16)
        .fillColor('red')
        .text('Nenhum serviço encontrado.', { align: 'center' })
        .fillColor('black');
    } else {
      // Cabeçalho da tabela com larguras dinâmicas proporcionais
      doc.moveDown(0.5);
      try {
        doc.font('Montserrat').fontSize(13).fillColor('#1a237e');
      } catch (e) {
        doc.fontSize(13).fillColor('#1a237e');
      }
      // Definir larguras proporcionais
      const colWidths = [120, 70, 90, 70, 70, 90];
      const colX = [
        60,
        60 + colWidths[0],
        60 + colWidths[0] + colWidths[1],
        60 + colWidths[0] + colWidths[1] + colWidths[2],
        60 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        60 +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4],
      ];
      doc.text('Serviço', colX[0], doc.y, { continued: true });
      doc.text('Tipo', colX[1], doc.y, { continued: true });
      doc.text('Disponibilidade', colX[2], doc.y, { continued: true });
      doc.text('Status', colX[3], doc.y, { continued: true });
      doc.text('SLA Alvo', colX[4], doc.y, { continued: true });
      doc.text('Último cálculo', colX[5], doc.y);
      try {
        doc.font('Montserrat-Regular').fillColor('black');
      } catch (e) {
        doc.fillColor('black');
      }
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1976d2');
      doc.moveDown(0.2);
      // Linhas da tabela
      summaries.forEach((summary, idx) => {
        const rowY = doc.y;
        doc.save();
        doc.rect(50, rowY, 495, 18).fill(idx % 2 === 0 ? '#e3eafc' : '#fff');
        doc.restore();
        try {
          doc.font('Montserrat-Regular').fillColor('#1a237e').fontSize(11);
        } catch (e) {
          doc.fillColor('#1a237e').fontSize(11);
        }
        doc.text(summary.serviceName, colX[0], rowY + 3, { continued: true });
        doc.text(serviceTypes[summary.serviceId] || '-', colX[1], rowY + 3, {
          continued: true,
        });
        doc.text(`${summary.currentAvailability}%`, colX[2], rowY + 3, {
          continued: true,
        });
        doc.text(summary.status, colX[3], rowY + 3, { continued: true });
        doc.text(`${summary.targetSLA}%`, colX[4], rowY + 3, {
          continued: true,
        });
        doc.text(
          new Date(summary.lastCalculated).toLocaleString('pt-PT'),
          colX[5],
          rowY + 3,
        );
        doc.moveDown(0.1);
      });
      try {
        doc.font('Montserrat-Regular').fillColor('black');
      } catch (e) {
        doc.fillColor('black');
      }
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
    // Buscar detalhes completos do serviço (incluindo configs, team, etc)
    const service = await (this.slaService as any).prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        Team: true,
        configs: {
          include: {
            PingConfig: true,
            HttpConfig: true,
            SnmpConfig: true,
            WebhookConfig: true,
          },
        },
        usersToNotify: { include: { User: true } },
      },
    });
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

    // Bloco de detalhes do serviço (dinâmico por tipo)
    doc
      .fontSize(14)
      .fillColor('#1976d2')
      .text('Detalhes do Serviço', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('black');
    doc.text(`Nome: ${service.name}`);
    doc.text(`Tipo: ${service.type}`);
    doc.text(`Descrição: ${service.description}`);
    doc.text(`Status: ${service.status}`);
    doc.text(
      `Criado em: ${new Date(service.createdAt).toLocaleString('pt-PT')}`,
    );
    if (service.Team) doc.text(`Team: ${service.Team.name}`);

    // Detalhes específicos por tipo
    if (service.type === 'PING' && service.configs?.PingConfig) {
      doc.moveDown(0.2);
      doc
        .fontSize(12)
        .fillColor('#0d47a1')
        .text('Configuração PING:', { underline: true });
      doc.fontSize(11).fillColor('black');
      doc.text(`IP: ${service.configs.PingConfig.ipAddress}`);
      if (service.configs.PingConfig.packetSize)
        doc.text(`Tamanho do pacote: ${service.configs.PingConfig.packetSize}`);
      if (service.configs.PingConfig.ttl)
        doc.text(`TTL: ${service.configs.PingConfig.ttl}`);
      if (service.configs.PingConfig.monitoringId)
        doc.text(`MonitoringId: ${service.configs.PingConfig.monitoringId}`);
    }
    if (service.type === 'HTTP' && service.configs?.HttpConfig) {
      doc.moveDown(0.2);
      doc
        .fontSize(12)
        .fillColor('#0d47a1')
        .text('Configuração HTTP:', { underline: true });
      doc.fontSize(11).fillColor('black');
      doc.text(`Endpoint: ${service.configs.HttpConfig.endpoint}`);
      doc.text(`Método: ${service.configs.HttpConfig.method}`);
      if (service.configs.HttpConfig.expectedStatus)
        doc.text(
          `Status esperado: ${service.configs.HttpConfig.expectedStatus}`,
        );
      if (service.configs.HttpConfig.expectedBodyIncludes)
        doc.text(
          `Body esperado: ${service.configs.HttpConfig.expectedBodyIncludes}`,
        );
      if (service.configs.HttpConfig.authType)
        doc.text(`Auth: ${service.configs.HttpConfig.authType}`);
      if (service.configs.HttpConfig.validateSSL !== undefined)
        doc.text(
          `Valida SSL: ${
            service.configs.HttpConfig.validateSSL ? 'Sim' : 'Não'
          }`,
        );
    }
    if (service.type === 'SNMP' && service.configs?.SnmpConfig) {
      doc.moveDown(0.2);
      doc
        .fontSize(12)
        .fillColor('#0d47a1')
        .text('Configuração SNMP:', { underline: true });
      doc.fontSize(11).fillColor('black');
      doc.text(`Host: ${service.configs.SnmpConfig.host}`);
      doc.text(`Versão: ${service.configs.SnmpConfig.version}`);
      if (service.configs.SnmpConfig.community)
        doc.text(`Community: ${service.configs.SnmpConfig.community}`);
      if (service.configs.SnmpConfig.oid)
        doc.text(`OID: ${service.configs.SnmpConfig.oid}`);
      if (service.configs.SnmpConfig.username)
        doc.text(`Usuário: ${service.configs.SnmpConfig.username}`);
      if (service.configs.SnmpConfig.authProtocol)
        doc.text(`Auth Protocol: ${service.configs.SnmpConfig.authProtocol}`);
      if (service.configs.SnmpConfig.privProtocol)
        doc.text(`Priv Protocol: ${service.configs.SnmpConfig.privProtocol}`);
    }
    if (service.type === 'WEBHOOK' && service.configs?.WebhookConfig) {
      doc.moveDown(0.2);
      doc
        .fontSize(12)
        .fillColor('#0d47a1')
        .text('Configuração Webhook:', { underline: true });
      doc.fontSize(11).fillColor('black');
      doc.text(`Endpoint: ${service.configs.WebhookConfig.endpoint}`);
      doc.text(`Método: ${service.configs.WebhookConfig.method}`);
      if (service.configs.WebhookConfig.provedor)
        doc.text(`Provedor: ${service.configs.WebhookConfig.provedor}`);
      if (service.configs.WebhookConfig.secret)
        doc.text(`Secret: ${service.configs.WebhookConfig.secret}`);
    }

    doc.moveDown();
    if (service.usersToNotify?.length) {
      doc.text(
        'Notificar usuários: ' +
          service.usersToNotify
            .map((u: any) => u.User?.email)
            .filter(Boolean)
            .join(', '),
      );
    }
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Nunca exibe mensagem de período vazio para o individual

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
