import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

const prisma = new PrismaClient();

@Injectable()
export class MetricsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async saveMetrics(data: any) {
    try {
    const metricSaved = await prisma.metric.create({
      data: {
        serviceId: data.serviceId,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        cpu: data.metrics?.cpu,
        memory: data.metrics?.memory,
        latency: data.latency ? data.latency['8.8.8.8'] : undefined,
        status: data.status || 'PENDING',
        errorMsg: data.errorMsg || null,
      },
    });

      this.eventEmitter.emit('dashboard.updated', metricSaved);
      return { success: true, id: metricSaved.id };

    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async getMetricsByHost(id: number) {
    return await prisma.metric.findMany({
      where: { serviceId : id },
      orderBy: { timestamp: 'desc' },
    });
  }
};
