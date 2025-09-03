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
    // Garantir que o diretório de armazenamento existe
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async generateAndSavePDF(
    serviceId: number,
    period?: string,
  ): Promise<string> {
    // Calcular datas baseado no período
    const { startDate, endDate } = this.calculatePeriodDates(period);

    let finalData;
    let isRealData = false;

    try {
      // Tentar obter dados SLA do serviço
      const slaData = await this.slaService.calculateSLA(
        serviceId,
        startDate,
        endDate,
      );

      if (slaData) {
        finalData = this.enrichRealDataForPDF(slaData);
        isRealData = true;
        console.log(
          `Usando dados REAIS para serviço ${serviceId}: ${slaData.serviceName}`,
        );
      }
    } catch (error) {
      console.log(
        `Serviço ${serviceId} não encontrado no banco, usando dados demo`,
      );
    }

    // Se não encontrar dados reais, usar dados demo
    if (!finalData) {
      finalData = this.generateDemoData(serviceId);
      console.log(
        `Usando dados DEMO para serviço ${serviceId}: ${finalData.serviceName}`,
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataType = isRealData ? 'real' : 'demo';
    const filename = `sla-${dataType}-report-${serviceId}-${timestamp}.pdf`;
    const filepath = path.join(this.storageDir, filename);

    // Criar documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Relatório SLA ${isRealData ? 'Real' : 'Demo'} - ${
          finalData.serviceName
        }`,
        Subject: `Relatório de Service Level Agreement (${
          isRealData ? 'Dados Reais' : 'Dados Demo'
        })`,
        Author: 'InfraWatch System',
        Keywords: `SLA, Monitoramento, Disponibilidade, ${
          isRealData ? 'Real' : 'Demo'
        }`,
      },
    });

    // Stream para arquivo
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Gerar conteúdo do PDF
    this.generatePDFContent(doc, finalData);

    // Finalizar documento
    doc.end();

    // Aguardar conclusão da escrita
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return filename;
  }

  async generateDemoPDF(): Promise<string> {
    // Tentar obter dados reais de diferentes serviços
    for (let serviceId = 1; serviceId <= 5; serviceId++) {
      try {
        const { startDate, endDate } = this.calculatePeriodDates('monthly');
        const realData = await this.slaService.calculateSLA(
          serviceId,
          startDate,
          endDate,
        );

        if (realData) {
          const enrichedData = this.enrichRealDataForPDF(realData);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `sla-real-demo-${serviceId}-${timestamp}.pdf`;
          const filepath = path.join(this.storageDir, filename);

          const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
              Title: `Relatório SLA Real - ${realData.serviceName}`,
              Subject: 'Relatório de Service Level Agreement (Dados Reais)',
              Author: 'InfraWatch System',
              Keywords: 'SLA, Monitoramento, Disponibilidade, Real',
            },
          });

          const stream = fs.createWriteStream(filepath);
          doc.pipe(stream);

          this.generatePDFContent(doc, enrichedData);
          doc.end();

          await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
          });

          console.log(
            `PDF real gerado para serviço ${serviceId}: ${realData.serviceName}`,
          );
          return filename;
        }
      } catch (error) {
        // Continua tentando outros serviços
        continue;
      }
    }

    console.log('Nenhum serviço real encontrado, usando dados demo');

    // Fallback para dados demo com serviço aleatório
    const randomServiceId = Math.floor(Math.random() * 5);
    const demoData = this.generateDemoData(randomServiceId);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sla-demo-report-${timestamp}.pdf`;
    const filepath = path.join(this.storageDir, filename);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Relatório SLA Demo - ${demoData.serviceName}`,
        Subject: 'Relatório de Service Level Agreement (Demo)',
        Author: 'InfraWatch System',
        Keywords: 'SLA, Monitoramento, Disponibilidade, Demo',
      },
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    this.generatePDFContent(doc, demoData);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return filename;
  }

  private generatePDFContent(doc: PDFKit.PDFDocument, slaData: any) {
    // Cores profissionais
    const colors = {
      primary: '#1e3a8a', // Azul escuro
      secondary: '#3b82f6', // Azul médio
      success: '#10b981', // Verde
      warning: '#f59e0b', // Laranja
      danger: '#ef4444', // Vermelho
      info: '#06b6d4', // Cyan
      dark: '#1f2937', // Cinza escuro
      light: '#f8fafc', // Cinza claro
      border: '#e5e7eb', // Borda
    };

    // === CABEÇALHO PROFISSIONAL ===
    // Fundo do cabeçalho
    doc.rect(0, 0, 612, 120).fill(colors.primary);

    // Empresa e sistema
    doc
      .fontSize(18)
      .fillColor('white')
      .text('RSC Angola', 50, 20, { align: 'left' });
    doc
      .fontSize(14)
      .fillColor('#93c5fd')
      .text('InfraWatch', 50, 45, { align: 'left' });

    // Título principal
    doc
      .fontSize(28)
      .fillColor('white')
      .text('RELATÓRIO SLA', 220, 30, { align: 'left' });

    // Subtítulo
    doc
      .fontSize(14)
      .fillColor('#93c5fd')
      .text('Service Level Agreement Report', 220, 65);

    // Data/Hora atual
    const currentDate = new Date().toLocaleString('pt-BR');
    doc
      .fontSize(10)
      .fillColor('#dbeafe')
      .text(`Gerado em: ${currentDate}`, 420, 45);

    // Status badge
    const statusColor =
      slaData.availability >= 99.9
        ? colors.success
        : slaData.availability >= 99.0
        ? colors.warning
        : colors.danger;
    const statusText =
      slaData.availability >= 99.9
        ? 'OPERACIONAL'
        : slaData.availability >= 99.0
        ? 'ATENÇÃO'
        : 'CRÍTICO';

    doc.rect(420, 65, 100, 25).fill(statusColor);
    doc
      .fontSize(12)
      .fillColor('white')
      .text(statusText, 420, 72, { width: 100, align: 'center' });

    // === INFORMAÇÕES DO SERVIÇO ===
    let yPos = 150;

    // Card de informações
    doc.rect(50, yPos, 512, 100).fill(colors.light).stroke(colors.border);

    // Título da seção
    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .text('INFORMAÇÕES DO SERVIÇO', 70, yPos + 15);

    // Informações em duas colunas
    doc.fontSize(12).fillColor(colors.dark);
    doc.text(
      `Serviço: ${slaData.serviceName || slaData.serviceType || 'Geral'}`,
      70,
      yPos + 40,
    );
    if (slaData.serviceType) {
      doc.text(`Tipo: ${slaData.serviceType}`, 70, yPos + 60);
    }
    doc.text(`Período: ${slaData.period}`, 320, yPos + 40);
    doc.text(
      `Última atualização: ${new Date().toLocaleString('pt-BR', {
        timeZone: 'Africa/Luanda',
      })}`,
      320,
      yPos + 60,
    );

    // === MÉTRICAS PRINCIPAIS (DASHBOARD STYLE) ===
    yPos += 130;

    // Título da seção
    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .text('MÉTRICAS DE PERFORMANCE', 50, yPos);

    yPos += 30;

    // Card 1: Disponibilidade
    const availabilityColor =
      slaData.availability >= 99.9
        ? colors.success
        : slaData.availability >= 99.0
        ? colors.warning
        : colors.danger;

    doc.rect(50, yPos, 120, 80).fill(availabilityColor);
    doc
      .fontSize(24)
      .fillColor('white')
      .text(`${slaData.availability}%`, 50, yPos + 15, {
        width: 120,
        align: 'center',
      });
    doc
      .fontSize(12)
      .text('DISPONIBILIDADE', 50, yPos + 50, { width: 120, align: 'center' });
    doc.fontSize(10).text('SLA Target: 99.9%', 50, yPos + 65, {
      width: 120,
      align: 'center',
    });

    // Card 2: Tempo de Resposta
    const rtColor =
      slaData.responseTime <= 100
        ? colors.success
        : slaData.responseTime <= 500
        ? colors.warning
        : colors.danger;

    doc.rect(190, yPos, 120, 80).fill(rtColor);
    doc
      .fontSize(18)
      .fillColor('white')
      .text(`${slaData.responseTime}ms`, 190, yPos + 15, {
        width: 120,
        align: 'center',
      });
    doc
      .fontSize(12)
      .text('TEMPO RESPOSTA', 190, yPos + 40, { width: 120, align: 'center' });
    doc
      .fontSize(10)
      .text(
        `P95: ${slaData.performanceData.p95ResponseTime.toFixed(1)}ms`,
        190,
        yPos + 55,
        { width: 120, align: 'center' },
      );
    doc
      .fontSize(10)
      .text(
        `P99: ${slaData.performanceData.p99ResponseTime.toFixed(1)}ms`,
        190,
        yPos + 65,
        { width: 120, align: 'center' },
      );

    // Card 3: Taxa de Erro
    const errorRateColor =
      parseFloat(slaData.errorRate) <= 0.1
        ? colors.success
        : parseFloat(slaData.errorRate) <= 1.0
        ? colors.warning
        : colors.danger;

    doc.rect(330, yPos, 120, 80).fill(errorRateColor);
    doc
      .fontSize(18)
      .fillColor('white')
      .text(`${slaData.errorRate}%`, 330, yPos + 15, {
        width: 120,
        align: 'center',
      });
    doc
      .fontSize(12)
      .text('TAXA DE ERRO', 330, yPos + 40, { width: 120, align: 'center' });
    doc
      .fontSize(10)
      .text(`${slaData.errorCount.toLocaleString()} erros`, 330, yPos + 55, {
        width: 120,
        align: 'center',
      });
    doc
      .fontSize(10)
      .text(
        `${slaData.totalRequests.toLocaleString()} requests`,
        330,
        yPos + 65,
        { width: 120, align: 'center' },
      );

    // Card 4: Uptime
    doc.rect(470, yPos, 92, 80).fill(colors.info);
    doc
      .fontSize(16)
      .fillColor('white')
      .text(`${slaData.uptime.toFixed(1)}h`, 470, yPos + 15, {
        width: 92,
        align: 'center',
      });
    doc
      .fontSize(12)
      .text('UPTIME', 470, yPos + 35, { width: 92, align: 'center' });
    doc.fontSize(10).text(`${slaData.downtime.toFixed(1)}h`, 470, yPos + 55, {
      width: 92,
      align: 'center',
    });
    doc
      .fontSize(10)
      .text('downtime', 470, yPos + 65, { width: 92, align: 'center' });

    // === MÉTRICAS DE INFRAESTRUTURA ===
    yPos += 110;

    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .text('MÉTRICAS DE INFRAESTRUTURA', 50, yPos);

    yPos += 30;

    // Barra de progresso para CPU
    this.drawProgressBar(
      doc,
      70,
      yPos,
      100,
      15,
      slaData.performanceData.avgCpuUsage,
      colors.warning,
      'CPU',
    );
    doc
      .fontSize(10)
      .fillColor(colors.dark)
      .text(
        `${slaData.performanceData.avgCpuUsage.toFixed(1)}%`,
        180,
        yPos + 3,
      );

    yPos += 25;

    // Barra de progresso para Memória
    this.drawProgressBar(
      doc,
      70,
      yPos,
      100,
      15,
      slaData.performanceData.avgMemoryUsage,
      colors.info,
      'Memória',
    );
    doc
      .fontSize(10)
      .fillColor(colors.dark)
      .text(
        `${slaData.performanceData.avgMemoryUsage.toFixed(1)}%`,
        180,
        yPos + 3,
      );

    yPos += 25;

    // Barra de progresso para Disco
    this.drawProgressBar(
      doc,
      70,
      yPos,
      100,
      15,
      slaData.performanceData.diskUsage,
      colors.success,
      'Disco',
    );
    doc
      .fontSize(10)
      .fillColor(colors.dark)
      .text(`${slaData.performanceData.diskUsage.toFixed(1)}%`, 180, yPos + 3);

    // Throughput de rede
    doc
      .fontSize(12)
      .fillColor(colors.dark)
      .text(
        `Throughput de Rede: ${slaData.performanceData.networkThroughput.toFixed(
          1,
        )} MB/s`,
        300,
        yPos - 35,
      );

    // === INCIDENTES RECENTES ===
    if (slaData.incidents && slaData.incidents.length > 0) {
      yPos += 80;

      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fontSize(16)
        .fillColor(colors.primary)
        .text('INCIDENTES RECENTES', 50, yPos);

      yPos += 30;

      slaData.incidents.slice(0, 4).forEach((incident: any, index: number) => {
        const severityColor =
          incident.severity === 'critical'
            ? colors.danger
            : incident.severity === 'major'
            ? colors.warning
            : colors.info;

        // Card do incidente
        doc.rect(50, yPos, 512, 60).fill('#ffffff').stroke(colors.border);

        // Indicador de severidade
        doc.rect(50, yPos, 8, 60).fill(severityColor);

        // Conteúdo do incidente
        doc
          .fontSize(12)
          .fillColor(colors.dark)
          .text(`${incident.title}`, 70, yPos + 10);

        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(
            `ID: ${
              incident.id
            } | Impacto: ${incident.affectedUsers.toLocaleString()} usuários`,
            70,
            yPos + 25,
          );

        doc.text(
          `${incident.startTime.toLocaleString(
            'pt-BR',
          )} - ${incident.endTime.toLocaleString('pt-BR')}`,
          70,
          yPos + 40,
        );

        // Status
        const statusBadgeColor =
          incident.status === 'resolved' ? colors.success : colors.warning;
        doc.rect(450, yPos + 10, 70, 20).fill(statusBadgeColor);
        doc
          .fontSize(10)
          .fillColor('white')
          .text(incident.status.toUpperCase(), 450, yPos + 15, {
            width: 70,
            align: 'center',
          });

        yPos += 70;
      });
    }

    // === RESUMO EXECUTIVO ===
    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    } else {
      yPos += 30;
    }

    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .text('RESUMO EXECUTIVO', 50, yPos);

    yPos += 30;

    const executiveSummary = this.generateExecutiveSummary(slaData);
    doc.rect(50, yPos, 512, 100).fill(colors.light).stroke(colors.border);

    doc
      .fontSize(11)
      .fillColor(colors.dark)
      .text(executiveSummary, 70, yPos + 15, { width: 472, align: 'justify' });

    // === RODAPÉ PROFISSIONAL ===
    yPos = 750;

    // Linha separadora
    doc.moveTo(50, yPos).lineTo(562, yPos).strokeColor(colors.border).stroke();

    // Informações do rodapé
    doc
      .fontSize(9)
      .fillColor('#888888')
      .text('InfraWatch Monitoring System', 50, yPos + 10)
      .text(`Relatório gerado automaticamente em ${currentDate}`, 50, yPos + 22)
      .text('Confidencial - Uso interno apenas', 400, yPos + 10, {
        align: 'right',
      })
      .text('suporte@infrawatch.com', 400, yPos + 22, { align: 'right' });
  }

  // Método auxiliar para desenhar barras de progresso
  private drawProgressBar(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    percentage: number,
    color: string,
    label: string,
  ) {
    // Fundo da barra
    doc.rect(x, y, width, height).fill('#e5e7eb');

    // Barra de progresso
    const progressWidth = (width * percentage) / 100;
    doc.rect(x, y, progressWidth, height).fill(color);

    // Label
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(label, x - 50, y + 3);
  }

  private generateExecutiveSummary(slaData: any): string {
    const availability = slaData.availability;
    const trend =
      availability >= 99.9
        ? 'excelente'
        : availability >= 99.0
        ? 'satisfatório'
        : 'preocupante';
    const recommendation =
      availability >= 99.9
        ? 'Continue monitorando as métricas atuais e mantenha os processos de manutenção preventiva.'
        : availability >= 99.0
        ? 'Recomenda-se investigar as causas dos incidentes recentes e implementar melhorias nos processos de monitoramento.'
        : 'AÇÃO IMEDIATA NECESSÁRIA: O serviço está abaixo dos níveis aceitáveis de SLA. Revisar imediatamente a infraestrutura e processos.';

    return `Durante o período de análise de ${slaData.period}, o serviço "${
      slaData.serviceName
    }" apresentou desempenho ${trend} com ${availability}% de disponibilidade. Foram processadas ${slaData.totalRequests.toLocaleString()} requisições com taxa de erro de ${
      slaData.errorRate
    }% e tempo médio de resposta de ${slaData.responseTime}ms.

${
  slaData.incidents.length > 0
    ? `Registramos ${
        slaData.incidents.length
      } incidente(s) que impactaram ${slaData.incidents
        .reduce((sum: number, inc: any) => sum + inc.affectedUsers, 0)
        .toLocaleString()} usuários no total. `
    : 'Não foram registrados incidentes críticos no período analisado. '
}

RECOMENDAÇÃO: ${recommendation}`;
  }

  private generateStatusSummary(slaData: any): string {
    const availability = slaData.availability;
    let status = '';

    if (availability >= 99.9) {
      status =
        'EXCELENTE - O serviço está operando dentro dos padrões de SLA estabelecidos.';
    } else if (availability >= 99.0) {
      status =
        'BOM - O serviço está próximo aos padrões de SLA, mas requer atenção.';
    } else if (availability >= 95.0) {
      status =
        'CRÍTICO - O serviço está abaixo dos padrões de SLA e necessita intervenção imediata.';
    } else {
      status =
        'FALHA GRAVE - O serviço apresentou problemas significativos de disponibilidade.';
    }

    return `Status do SLA: ${status}\n\nDurante o período analisado de ${
      slaData.period
    }, o serviço "${
      slaData.serviceName
    }" apresentou ${availability}% de disponibilidade com ${
      slaData.totalChecks
    } verificações realizadas. ${
      slaData.failedChecks > 0
        ? `Foram registradas ${
            slaData.failedChecks
          } falhas que resultaram em ${slaData.downtime.toFixed(
            2,
          )} horas de indisponibilidade.`
        : 'Não foram registradas falhas significativas no período.'
    } O tempo de resposta médio foi de ${slaData.responseTime.toFixed(2)}ms.`;
  }

  private calculatePeriodDates(period?: string): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Padrão: última semana
    }

    return { startDate, endDate: now };
  }

  async listSavedReports(): Promise<
    Array<{ filename: string; createdAt: Date; size: number }>
  > {
    try {
      const files = fs.readdirSync(this.storageDir);
      const pdfFiles = files.filter((file) => file.endsWith('.pdf'));

      return pdfFiles
        .map((filename) => {
          const filepath = path.join(this.storageDir, filename);
          const stats = fs.statSync(filepath);
          return {
            filename,
            createdAt: stats.birthtime,
            size: stats.size,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      console.error('Erro ao listar relatórios:', error);
      return [];
    }
  }

  async getReportFile(filename: string): Promise<Buffer | null> {
    try {
      const filepath = path.join(this.storageDir, filename);
      if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath);
      }
      return null;
    } catch (error: any) {
      console.error('Erro ao ler arquivo:', error);
      return null;
    }
  }

  async deleteReport(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.storageDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  // Método para gerar dados demo para teste ou complementar dados reais
  generateDemoData(serviceId: number) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias

    // Simular dados realistas de diferentes tipos de serviços
    const services = [
      {
        name: 'API Gateway Principal',
        type: 'API REST',
        availability: 99.94,
        responseTime: 85.2,
        requests: 2847592,
        errors: 1704,
        criticalIncidents: 1,
        minorIncidents: 3,
      },
      {
        name: 'Banco PostgreSQL Produção',
        type: 'Database',
        availability: 99.97,
        responseTime: 12.8,
        requests: 5294817,
        errors: 1588,
        criticalIncidents: 0,
        minorIncidents: 2,
      },
      {
        name: 'Load Balancer NGINX',
        type: 'Infrastructure',
        availability: 99.99,
        responseTime: 4.3,
        requests: 8934756,
        errors: 894,
        criticalIncidents: 0,
        minorIncidents: 1,
      },
      {
        name: 'Redis Cache Cluster',
        type: 'Cache',
        availability: 99.92,
        responseTime: 1.8,
        requests: 12847365,
        errors: 10278,
        criticalIncidents: 2,
        minorIncidents: 4,
      },
      {
        name: 'Portal Web Corporativo',
        type: 'Web Application',
        availability: 99.89,
        responseTime: 234.7,
        requests: 189473,
        errors: 2085,
        criticalIncidents: 1,
        minorIncidents: 6,
      },
    ];

    const selectedService = services[serviceId % services.length];
    const totalHours = 24 * 30; // 30 dias
    const uptimeHours = (totalHours * selectedService.availability) / 100;
    const downtimeHours = totalHours - uptimeHours;

    return {
      serviceId,
      serviceName: selectedService.name,
      serviceType: selectedService.type,
      availability: selectedService.availability,
      responseTime: selectedService.responseTime,
      uptime: uptimeHours,
      downtime: downtimeHours,
      totalChecks: Math.floor(totalHours * 60), // Check a cada minuto
      successfulChecks: Math.floor(
        (totalHours * 60 * selectedService.availability) / 100,
      ),
      failedChecks: Math.floor(
        (totalHours * 60 * (100 - selectedService.availability)) / 100,
      ),
      totalRequests: selectedService.requests,
      errorCount: selectedService.errors,
      errorRate: (
        (selectedService.errors / selectedService.requests) *
        100
      ).toFixed(3),
      period: 'últimos 30 dias',
      startDate,
      endDate: now,
      incidents: this.generateRealisticIncidents(
        selectedService.criticalIncidents,
        selectedService.minorIncidents,
        now,
      ),
      metrics: this.generateHourlyMetrics(30),
      performanceData: {
        p95ResponseTime: selectedService.responseTime * 1.8,
        p99ResponseTime: selectedService.responseTime * 2.4,
        maxResponseTime: selectedService.responseTime * 3.2,
        minResponseTime: selectedService.responseTime * 0.3,
        avgCpuUsage: Math.random() * 20 + 40, // 40-60%
        avgMemoryUsage: Math.random() * 30 + 50, // 50-80%
        diskUsage: Math.random() * 20 + 30, // 30-50%
        networkThroughput: Math.random() * 500 + 100, // 100-600 MB/s
      },
    };
  }

  // Método para enriquecer dados reais com informações adicionais para o PDF
  private enrichRealDataForPDF(realData: any): any {
    // Se os dados reais não têm campos necessários para o PDF, adicionar
    const enrichedData = {
      ...realData,
      serviceType:
        realData.serviceType || this.inferServiceType(realData.serviceName),
      totalRequests: realData.totalRequests || realData.totalChecks * 10, // Estimar
      errorCount: realData.errorCount || realData.failedChecks,
      errorRate:
        realData.errorRate ||
        this.calculateErrorRate(realData.failedChecks, realData.totalChecks),
      performanceData:
        realData.performanceData || this.generatePerformanceData(realData),
    };

    return enrichedData;
  }

  private inferServiceType(serviceName: string): string {
    const name = serviceName.toLowerCase();
    if (name.includes('api') || name.includes('gateway')) return 'API REST';
    if (
      name.includes('postgres') ||
      name.includes('database') ||
      name.includes('db')
    )
      return 'Database';
    if (
      name.includes('load') ||
      name.includes('balancer') ||
      name.includes('nginx')
    )
      return 'Infrastructure';
    if (name.includes('redis') || name.includes('cache')) return 'Cache';
    if (
      name.includes('web') ||
      name.includes('portal') ||
      name.includes('site')
    )
      return 'Web Application';
    if (name.includes('monitor')) return 'Monitoring';
    return 'Service';
  }

  private calculateErrorRate(
    failedChecks: number,
    totalChecks: number,
  ): string {
    if (totalChecks === 0) return '0.000';
    return ((failedChecks / totalChecks) * 100).toFixed(3);
  }

  private generatePerformanceData(realData: any): any {
    const baseResponseTime = realData.responseTime || 100;

    // Calcular métricas baseadas nos dados reais se disponíveis
    let avgCpu = 50,
      avgMemory = 60,
      diskUsage = 40;

    if (realData.metrics && realData.metrics.length > 0) {
      const validMetrics = realData.metrics.filter(
        (m: any) => m.cpuUsage && m.memoryUsage,
      );
      if (validMetrics.length > 0) {
        avgCpu =
          validMetrics.reduce((sum: number, m: any) => sum + m.cpuUsage, 0) /
          validMetrics.length;
        avgMemory =
          validMetrics.reduce((sum: number, m: any) => sum + m.memoryUsage, 0) /
          validMetrics.length;
      }
    }

    return {
      p95ResponseTime: baseResponseTime * 1.8,
      p99ResponseTime: baseResponseTime * 2.4,
      maxResponseTime: baseResponseTime * 3.2,
      minResponseTime: baseResponseTime * 0.3,
      avgCpuUsage: avgCpu,
      avgMemoryUsage: avgMemory,
      diskUsage: diskUsage,
      networkThroughput: Math.random() * 500 + 100,
    };
  }

  private generateRealisticIncidents(
    critical: number,
    minor: number,
    now: Date,
  ) {
    const incidents = [];

    // Incidentes críticos
    for (let i = 0; i < critical; i++) {
      const startTime = new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      const duration = Math.random() * 120 + 30; // 30-150 minutos
      incidents.push({
        id: `CRIT-${String(i + 1).padStart(3, '0')}`,
        title: 'Falha de Conectividade Crítica',
        description: 'Perda total de conectividade com o serviço',
        severity: 'critical',
        startTime,
        endTime: new Date(startTime.getTime() + duration * 60 * 1000),
        status: 'resolved',
        impact: `Serviço indisponível por ${Math.floor(duration)} minutos`,
        affectedUsers: Math.floor(Math.random() * 5000 + 1000),
        rootCause: 'Falha de hardware no data center',
      });
    }

    // Incidentes menores
    for (let i = 0; i < minor; i++) {
      const startTime = new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      const duration = Math.random() * 30 + 5; // 5-35 minutos
      incidents.push({
        id: `MIN-${String(i + 1).padStart(3, '0')}`,
        title: 'Degradação de Performance',
        description: 'Lentidão detectada no tempo de resposta',
        severity: 'minor',
        startTime,
        endTime: new Date(startTime.getTime() + duration * 60 * 1000),
        status: 'resolved',
        impact: `Performance degradada por ${Math.floor(duration)} minutos`,
        affectedUsers: Math.floor(Math.random() * 500 + 50),
        rootCause: 'Alto volume de requisições',
      });
    }

    return incidents.sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }

  private generateHourlyMetrics(days: number) {
    const metrics = [];
    const now = new Date();

    for (let i = 0; i < days * 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      metrics.push({
        timestamp,
        availability: 95 + Math.random() * 5, // 95-100%
        responseTime: 80 + Math.random() * 100, // 80-180ms
        requestCount: Math.floor(Math.random() * 1000 + 500),
        errorCount: Math.floor(Math.random() * 10),
        cpuUsage: 30 + Math.random() * 40, // 30-70%
        memoryUsage: 40 + Math.random() * 40, // 40-80%
      });
    }

    return metrics.reverse();
  }
}
