import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './metrics.entity';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Metrics received and saved successfully',
    schema: {
      example: {
        success: true,
        message: 'Métricas salvas com sucesso',
        metric: {
          host: 'server01.local',
          cpu: 12.5,
          memory: 2048,
          disk: 50.2,
          timestamp: '2025-08-08T12:00:00Z'
        }
      }
    }
  })
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
  @ApiResponse({
    status: 200,
    description: 'Metrics for the specified host',
    schema: {
      example: {
        host: 'server01.local',
        cpu: 12.5,
        memory: 2048,
        disk: 50.2,
        timestamp: '2025-08-08T12:00:00Z'
      }
    }
  })
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
  @ApiResponse({
    status: 200,
    description: 'Returns all metrics',
    schema: {
      example: [
        {
          host: 'server01.local',
          cpu: 12.5,
          memory: 2048,
          disk: 50.2,
          timestamp: '2025-08-08T12:00:00Z'
        },
        {
          host: 'server02.local',
          cpu: 8.3,
          memory: 1024,
          disk: 70.1,
          timestamp: '2025-08-08T12:05:00Z'
        }
      ]
    }
  })
  async getAllMetrics() {
    try {
      return await this.metricsService.getAllMetrics();
    } catch (error) {
      console.error('Erro ao buscar todas as métricas:', error);
      throw new Error('Erro interno do servidor');
    }
  }
}
