import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { PingService } from './ping.service';

@Controller('monitors')
export class MonitorsController {

  constructor(
    private readonly monitorsService: MonitorsService,
    private readonly pingService: PingService,
  ) {}

  /**
   * Lista estatísticas dos monitores ativos
   */
  @Get('stats')
  async getStats() {
    return this.monitorsService.getMonitoringStats();
  }
}