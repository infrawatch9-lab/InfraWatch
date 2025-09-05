import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { InfluxDBService } from './influxdb.service';
import { MetricsAnalysisService } from './metrics-analysis.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, InfluxDBService, MetricsAnalysisService],
  exports: [MetricsService, InfluxDBService, MetricsAnalysisService], // Exportar para uso em outros módulos
})
export class MetricsModule {}
