import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { PingService } from './ping.service';

@Controller('monitors')
export class MonitorsController {
  private readonly logger = new Logger(MonitorsController.name);

  constructor(
    private readonly monitorsService: MonitorsService,
    private readonly pingService: PingService,
  ) {}

  /**
   * Testa ping manual para um hostname
   */
  @Post('test/ping')
  async testPing(@Body() body: { hostname: string; timeout?: number }) {
    const { hostname, timeout = 5000 } = body;
    
    this.logger.log(`Testando ping manual para: ${hostname}`);
    
    const startTime = Date.now();
    const result = await this.pingService.testConnectivity(hostname, timeout);
    const totalTime = Date.now() - startTime;

    return {
      hostname,
      timeout,
      totalTime,
      ...result,
      timestamp: new Date(),
    };
  }

  /**
   * Executa monitoramento manual de um serviço
   */
  @Post('test/service/:id')
  async testService(@Param('id') serviceId: string) {
    // Simula um serviço para teste
    const mockService = {
      id: parseInt(serviceId),
      name: `Teste-${serviceId}`,
      endpoint: '8.8.8.8', // DNS do Google
      type: 'SERVER',
    };

    const mockConfig = {
      timeout: 5000,
      frequency: 30,
    };

    this.logger.log(`Testando monitoramento do serviço: ${mockService.name}`);

    const result = await this.pingService.monitor(mockService, mockConfig);

    return {
      service: mockService,
      config: mockConfig,
      result,
    };
  }

  /**
   * Lista estatísticas dos monitores ativos
   */
  @Get('stats')
  async getStats() {
    return this.monitorsService.getMonitoringStats();
  }

  /**
   * Teste múltiplos hosts
   */
  @Post('test/multiple')
  async testMultipleHosts(@Body() body: { hosts: string[] }) {
    const { hosts } = body;
    const results: Array<{
      host: string;
      success: boolean;
      latency?: number;
      error?: string;
      timestamp: Date;
    }> = [];

    for (const host of hosts) {
      const result = await this.pingService.testConnectivity(host);
      results.push({
        host,
        ...result,
        timestamp: new Date(),
      });
    }

    return {
      total: hosts.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}