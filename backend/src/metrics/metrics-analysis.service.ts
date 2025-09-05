import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsAnalysisService {
  private readonly logger = new Logger(MetricsAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService
  ) {}

  /**
   * Analisa métricas reais do sistema
   * Remove qualquer dependência de dados mockados
   */
  async analyzeRealMetrics() {
    this.logger.log('🔍 Iniciando análise de métricas reais do sistema...');

    try {
      // 1. Buscar serviços reais cadastrados
      const services = await this.prisma.service.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!services.length) {
        this.logger.warn('❌ Nenhum serviço encontrado no sistema');
        return {
          success: false,
          message: 'Sistema não possui serviços cadastrados'
        };
      }

      this.logger.log(`📊 Encontrados ${services.length} serviços no sistema`);

      // 2. Analisar métricas de cada serviço
      const analysis = [];

      for (const service of services) {
        this.logger.log(`🔍 Analisando serviço: ${service.name} (${service.type})`);

        try {
          // Buscar métricas no PostgreSQL
          const postgresMetrics = await this.metricsService.getMetricsByHost(service.id);
          
          // Buscar métricas do InfluxDB (com fallback)
          const influxMetrics = await this.metricsService.getRealtimeMetrics(service.id, '24h');
          
          // Análise de latência
          const latencyData = await this.metricsService.getLatencyAnalysis(service.id, '24h');

          // Calcular estatísticas reais
          const stats = await this.calculateServiceStats(service.id, postgresMetrics);

          analysis.push({
            service: {
              id: service.id,
              name: service.name,
              type: service.type,
              status: service.status
            },
            metrics: {
              postgresql: {
                total: postgresMetrics.length,
                latest: postgresMetrics[0] || null
              },
              influxdb: {
                total: influxMetrics.length,
                available: influxMetrics.length > 0
              },
              latency: {
                measurements: latencyData.length,
                available: latencyData.length > 0
              }
            },
            statistics: stats
          });

        } catch (error) {
          this.logger.error(`❌ Erro ao analisar serviço ${service.name}:`, error);
          analysis.push({
            service: {
              id: service.id,
              name: service.name,
              type: service.type,
              status: service.status
            },
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      // 3. Estatísticas gerais do sistema
      const systemStats = await this.getSystemStatistics();

      return {
        success: true,
        timestamp: new Date().toISOString(),
        system: systemStats,
        services: analysis,
        summary: {
          totalServices: services.length,
          servicesWithMetrics: analysis.filter(a => !a.error && a.metrics && a.metrics.postgresql.total > 0).length,
          servicesWithInfluxDB: analysis.filter(a => !a.error && a.metrics && a.metrics.influxdb.available).length
        }
      };

    } catch (error) {
      this.logger.error('❌ Erro na análise de métricas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calcula estatísticas reais de um serviço
   */
  private async calculateServiceStats(serviceId: number, metrics: any[]) {
    if (!metrics.length) {
      return {
        availability: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgLatency: 0,
        lastUpdate: null
      };
    }

    // Filtrar métricas dos últimos 7 dias para análise
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => new Date(m.timestamp) >= sevenDaysAgo);

    if (!recentMetrics.length) {
      return {
        availability: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgLatency: 0,
        lastUpdate: metrics[0]?.timestamp || null
      };
    }

    // Calcular médias reais
    const avgCpu = recentMetrics
      .filter(m => m.cpu !== null)
      .reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.filter(m => m.cpu !== null).length || 0;

    const avgMemory = recentMetrics
      .filter(m => m.memory !== null)
      .reduce((sum, m) => sum + m.memory, 0) / recentMetrics.filter(m => m.memory !== null).length || 0;

    const avgLatency = recentMetrics
      .filter(m => m.latency !== null)
      .reduce((sum, m) => sum + m.latency, 0) / recentMetrics.filter(m => m.latency !== null).length || 0;

    // Calcular disponibilidade baseada no status
    const activeMetrics = recentMetrics.filter(m => m.status === 'ACTIVE').length;
    const availability = (activeMetrics / recentMetrics.length) * 100;

    return {
      availability: Math.round(availability * 100) / 100,
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgLatency: Math.round(avgLatency * 100) / 100,
      lastUpdate: recentMetrics[0]?.timestamp || null,
      period: '7 days',
      sampleSize: recentMetrics.length
    };
  }

  /**
   * Obtém estatísticas gerais do sistema
   */
  private async getSystemStatistics() {
    try {
      const [
        totalServices,
        totalMetrics,
        totalAlerts,
        recentMetrics
      ] = await Promise.all([
        this.prisma.service.count(),
        this.prisma.metric.count(),
        this.prisma.alert.count(),
        this.prisma.metric.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
            }
          }
        })
      ]);

      // Verificar status do InfluxDB
      const influxStatus = await this.metricsService.getInfluxDBStatus();

      return {
        database: {
          postgresql: {
            services: totalServices,
            metrics: totalMetrics,
            alerts: totalAlerts,
            recentMetrics: recentMetrics
          },
          influxdb: {
            connected: influxStatus.connected,
            status: influxStatus.message
          }
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Erro ao obter estatísticas do sistema:', error);
      throw error;
    }
  }

  /**
   * Obtém dados reais para um dashboard específico
   */
  async getDashboardData(serviceId?: number, timeRange: string = '24h') {
    try {
      if (serviceId) {
        // Dados específicos de um serviço
        const service = await this.prisma.service.findUnique({
          where: { id: serviceId },
          include: {
            _count: {
              select: {
                metrics: true,
                alerts: true
              }
            }
          }
        });

        if (!service) {
          throw new Error('Serviço não encontrado');
        }

        const [
          realtimeMetrics,
          latencyData,
          aggregatedData
        ] = await Promise.all([
          this.metricsService.getRealtimeMetrics(serviceId, timeRange),
          this.metricsService.getLatencyAnalysis(serviceId, timeRange),
          this.metricsService.getAggregatedMetrics(serviceId, timeRange, '15m')
        ]);

        return {
          service,
          metrics: {
            realtime: realtimeMetrics,
            latency: latencyData,
            aggregated: aggregatedData
          },
          counts: service._count
        };

      } else {
        // Overview geral do sistema
        const services = await this.prisma.service.findMany({
          include: {
            _count: {
              select: {
                metrics: true,
                alerts: true
              }
            }
          },
          take: 10 // Limitar para performance
        });

        return {
          services,
          system: await this.getSystemStatistics()
        };
      }

    } catch (error) {
      this.logger.error('❌ Erro ao obter dados do dashboard:', error);
      throw error;
    }
  }
}
