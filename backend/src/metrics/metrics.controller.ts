import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsAnalysisService } from './metrics-analysis.service';
import { CreateMetricDto } from './metrics.entity';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly metricsAnalysisService: MetricsAnalysisService
  ) {}

  @Post()
  @Public()
  async receiveMetrics(@Body() data: CreateMetricDto) {
    try {
      console.log('Recebendo métricas:', data);
      const result = await this.metricsService.saveMetrics(data);
      return result;
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get(':id')
  async getMetricsByHost(@Param('id', ParseIntPipe) id: number) {
    try {
      const metrics = await this.metricsService.getMetricsByHost(id);
      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas por host:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  // Novos endpoints para InfluxDB
  @Get('realtime/:id')
  @Public()
  async getRealtimeMetrics(
    @Param('id', ParseIntPipe) id: number,
    @Query('timeRange') timeRange: string = '1h'
  ) {
    try {
      const metrics = await this.metricsService.getRealtimeMetrics(id, timeRange);
      return {
        success: true,
        serviceId: id,
        timeRange,
        data: metrics,
        source: 'influxdb'
      };
    } catch (error) {
      console.error('Erro ao buscar métricas em tempo real:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('latency/:id')
  @Public()
  async getLatencyAnalysis(
    @Param('id', ParseIntPipe) id: number,
    @Query('timeRange') timeRange: string = '1h'
  ) {
    try {
      const latencyData = await this.metricsService.getLatencyAnalysis(id, timeRange);
      return {
        success: true,
        serviceId: id,
        timeRange,
        data: latencyData,
        source: 'influxdb'
      };
    } catch (error) {
      console.error('Erro ao buscar análise de latência:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('aggregated/:id')
  @Public()
  async getAggregatedMetrics(
    @Param('id', ParseIntPipe) id: number,
    @Query('timeRange') timeRange: string = '1h',
    @Query('window') window: string = '5m'
  ) {
    try {
      const aggregatedData = await this.metricsService.getAggregatedMetrics(id, timeRange, window);
      return {
        success: true,
        serviceId: id,
        timeRange,
        aggregationWindow: window,
        data: aggregatedData,
        source: 'influxdb'
      };
    } catch (error) {
      console.error('Erro ao buscar métricas agregadas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('health/influxdb')
  @Public()
  async getInfluxDBHealth() {
    try {
      const health = await this.metricsService.getInfluxDBStatus();
      return {
        success: true,
        influxdb: health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao verificar status do InfluxDB:', error);
      return {
        success: false,
        influxdb: {
          connected: false,
          message: 'Failed to check InfluxDB status'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Novos endpoints para análise de dados reais
  @Get('analysis/system')
  @Public()
  async getSystemAnalysis() {
    try {
      const analysis = await this.metricsAnalysisService.analyzeRealMetrics();
      return analysis;
    } catch (error) {
      console.error('Erro ao analisar métricas do sistema:', error);
      return {
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('dashboard')
  @Public()
  async getDashboardOverview() {
    try {
      const dashboardData = await this.metricsAnalysisService.getDashboardData();
      return {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      return {
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('dashboard/:id')
  @Public()
  async getServiceDashboard(
    @Param('id', ParseIntPipe) serviceId: number,
    @Query('timeRange') timeRange: string = '24h'
  ) {
    try {
      const dashboardData = await this.metricsAnalysisService.getDashboardData(serviceId, timeRange);
      return {
        success: true,
        serviceId,
        timeRange,
        data: dashboardData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erro ao obter dashboard do serviço ${serviceId}:`, error);
      return {
        success: false,
        serviceId,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      };
    }
  }
}
