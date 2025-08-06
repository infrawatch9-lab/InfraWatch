import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMetricDto } from './metrics.entity';

const prisma = new PrismaClient();

@Injectable()
export class MetricsService {
  async saveMetrics(data: CreateMetricDto, token: string) {
    // Encontra o agente pelo host
    const agent = await prisma.agent.findUnique({
      where: { host: data.host },
    });

    // Se não existir, cria o agente
    const agentRecord = agent ?? await prisma.agent.create({
      data: { host: data.host },
    });

    // Cria a métrica relacionada ao agente
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
        agentId: agentRecord.id,
      },
    });
    return { message: 'Métrica registrada com sucesso' };
  }
}


