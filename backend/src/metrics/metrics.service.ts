import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InfluxDBService } from './influxdb.service';

const prisma = new PrismaClient();

@Injectable()
export class MetricsService {
  constructor(
    private eventEmitter: EventEmitter2,
    private influxDBService: InfluxDBService
  ) {}

  async saveMetrics(data: any) {
    try {
      // 1. Salvar no PostgreSQL (comportamento existente)
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

      // 2. Salvar no InfluxDB (nova funcionalidade)
      try {
        await this.influxDBService.writeMetrics({
          serviceId: data.serviceId,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          cpu: data.metrics?.cpu,
          memory: data.metrics?.memory,
          latency: data.latency ? data.latency['8.8.8.8'] : undefined,
          disk: data.metrics?.disk,
          networkIn: data.metrics?.network?.bytes_recv,
          networkOut: data.metrics?.network?.bytes_sent,
          status: data.status || 'PENDING',
          host: data.host
        });
      } catch (influxError) {
        console.warn('⚠️ Failed to write to InfluxDB, continuing with PostgreSQL only:', influxError);
        // Não falha a operação se InfluxDB estiver indisponível
      }

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

  // Novos métodos para dados do InfluxDB
  async getRealtimeMetrics(serviceId: number, timeRange: string = '1h') {
    try {
      return await this.influxDBService.getMetricsByService(serviceId, timeRange);
    } catch (error) {
      console.warn('⚠️ Failed to get InfluxDB metrics, falling back to PostgreSQL:', error);
      // Fallback para PostgreSQL se InfluxDB falhar
      return await this.getMetricsByHost(serviceId);
    }
  }

  async getLatencyAnalysis(serviceId: number, timeRange: string = '1h') {
    try {
      return await this.influxDBService.getLatencyMetrics(serviceId, timeRange);
    } catch (error) {
      console.warn('⚠️ Failed to get InfluxDB latency data:', error);
      return [];
    }
  }

  async getAggregatedMetrics(
    serviceId: number, 
    timeRange: string = '1h', 
    aggregationWindow: string = '5m'
  ) {
    try {
      return await this.influxDBService.getAggregatedMetrics(serviceId, timeRange, aggregationWindow);
    } catch (error) {
      console.warn('⚠️ Failed to get aggregated InfluxDB metrics:', error);
      return [];
    }
  }

  async getInfluxDBStatus() {
    return await this.influxDBService.getHealthStatus();
  }
};
