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
      let id = data.serviceId;

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
      };

      const metricSaved = await prisma.metric.create({
        data: {
          ...metricData,
          status: data.status || 'OK', // Provide a default or use from input
          Service: {
            connect: { id: id }
          }
        }
      });

      return { success: true, id: metricSaved.id };
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async getMetricsByHost(id: number) {
    return await prisma.metric.findMany({
      where: { serviceId: id },
      orderBy: { timestamp: 'desc' },
    });
  }
};
