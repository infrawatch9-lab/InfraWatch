import { Injectable } from '@nestjs/common';
import { JwtPayloadAgent } from '../auth/auth.entity';
import { PrismaClient } from '@prisma/client';
import { CreateMetricDto } from './metrics.entity';

const prisma = new PrismaClient();

@Injectable()
export class MetricsService {
    async saveMetrics(data: CreateMetricDto) {
    const agentHost = data.host;

    const agent = await prisma.agent.upsert({
      where: { host: agentHost },
      create: { host: agentHost },
      update: {},
    });

    await prisma.agentMetric.create({
      data: {
        timestamp: new Date(data.timestamp),
        cpu: data.metrics.cpu,
        memory: data.metrics.memory,
        disk: data.metrics.disk,
        uptime: data.metrics.uptime_seconds,
        bytesSent: BigInt(data.metrics.network.bytes_sent),
        bytesRecv: BigInt(data.metrics.network.bytes_recv),
        latency: data.latency,
        logs: data.logs ?? [],
        alerts: data.alerts ?? [],
        agentId: agent.id,
      },
    });

    return { success: true, message: 'Métricas registradas com sucesso' };
  }

  async getMetricsByHost(host: string) {
    return await prisma.agentMetric.findMany({
      where: { agent: { host } },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAllMetrics() {
    return await prisma.agentMetric.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }
};

