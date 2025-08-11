import { Injectable } from '@nestjs/common';
import { JwtPayloadAgent } from '../auth/auth.entity';
import { PrismaClient } from '@prisma/client';
import { CreateMetricDto } from './metrics.entity';

const prisma = new PrismaClient();

@Injectable()
export class MetricsService {
  async saveMetrics(data: any) {
    try {
      // Determina o host baseado no formato dos dados
      let agentHost = data.host;

      // Se não tem host mas tem serviceId, usa um host baseado no serviceId
      if (!agentHost && data.serviceId) {
        agentHost = `service-${data.serviceId}`;
      }

      // Se ainda não tem host, usa 'default-agent'
      if (!agentHost) {
        agentHost = 'default-agent';
      }

      const agent = await prisma.agent.upsert({
        where: { host: agentHost },
        create: { host: agentHost },
        update: {},
      });

      // Formato compatível com o teste e com o formato original
      const metricData = {
        timestamp: new Date(data.timestamp || new Date()),
        cpu: data.metrics?.cpu || data.cpuUsage || 0,
        memory: data.metrics?.memory || data.memoryUsage || 0,
        disk: data.metrics?.disk || data.diskUsage || 0,
        uptime: data.metrics?.uptime_seconds || 0,
        bytesSent: BigInt(data.metrics?.network?.bytes_sent || 0),
        bytesRecv: BigInt(data.metrics?.network?.bytes_recv || 0),
        latency: data.latency || data.networkLatency || 0,
        logs: data.logs ?? [],
        alerts: data.alerts ?? [],
        agentId: agent.id,
      };

      await prisma.agentMetric.create({
        data: metricData,
      });

      return { success: true, host: agentHost, serviceId: data.serviceId };
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async getMetricsByHost(host: string) {
    return await prisma.agentMetric.findMany({
      where: { agent: { host } },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAllMetrics() {
    const metrics = await prisma.agentMetric.findMany({
      orderBy: { timestamp: 'desc' },
    });

    // Converte BigInt para string para evitar erro de serialização JSON
    return metrics.map((metric) => ({
      ...metric,
      bytesSent: metric.bytesSent.toString(),
      bytesRecv: metric.bytesRecv.toString(),
    }));
  }
}
