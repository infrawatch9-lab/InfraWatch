import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './metrics.entity';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

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

  @Get(':host')
  async getMetricsByHost(@Param('host') host: string) {
    try {
      const metrics = await this.metricsService.getMetricsByHost(host);
      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas por host:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get()
  async getAllMetrics() {
    try {
      return await this.metricsService.getAllMetrics();
    } catch (error) {
      console.error('Erro ao buscar todas as métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }
}
