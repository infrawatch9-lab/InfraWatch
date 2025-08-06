import { Controller, Post, Body, Headers } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './metrics.entity';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  async receiveMetrics(
    @Body() data: CreateMetricDto,
    @Headers('authorization') token: string,
  ) {
    return this.metricsService.saveMetrics(data, token);
  }
}
