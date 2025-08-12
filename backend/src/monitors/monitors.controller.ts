import { Controller, Get, Post, Body, Param, Logger, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitorsService } from './monitors.service';
import { PingService } from './ping.service';
import { WebhookService } from './webhook.service';
import { SnmpService } from './snmp.service';

@ApiTags('monitors')
@Controller('monitors')
export class MonitorsController {
  private readonly logger = new Logger(MonitorsController.name);

  constructor(
    private readonly monitorsService: MonitorsService,
    private readonly pingService: PingService,
    private readonly webhookService: WebhookService,
    private readonly snmpService: SnmpService,
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
   /**
   * Inicia monitoramento de um serviço específico
   */
  @Post('start/:serviceId')
  @ApiOperation({ summary: 'Iniciar monitoramento de um serviço' })
  @ApiResponse({ status: 200, description: 'Monitoramento iniciado com sucesso' })
  async startMonitoring(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      this.logger.log(`Iniciando monitoramento para serviço ID: ${serviceId}`);
      await this.monitorsService.addService(serviceId);
      
      return {
        success: true,
        message: `Monitoramento iniciado para serviço ${serviceId}`,
        serviceId,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao iniciar monitoramento: ${errorMessage}`);
      throw new BadRequestException('Erro ao iniciar monitoramento');
    }
  }

    /**
   * Para monitoramento de um serviço específico
   */
  @Post('stop/:serviceId')
  @ApiOperation({ summary: 'Parar monitoramento de um serviço' })
  @ApiResponse({ status: 200, description: 'Monitoramento parado com sucesso' })
  async stopMonitoring(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      this.logger.log(`Parando monitoramento para serviço ID: ${serviceId}`);
      await this.monitorsService.removeService(serviceId);
      
      return {
        success: true,
        message: `Monitoramento parado para serviço ${serviceId}`,
        serviceId,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao parar monitoramento: ${errorMessage}`);
      throw new BadRequestException('Erro ao parar monitoramento');
    }
  }

   /**
   * Reinicia monitoramento de um serviço
   */
  @Post('restart/:serviceId')
  @ApiOperation({ summary: 'Reiniciar monitoramento de um serviço' })
  @ApiResponse({ status: 200, description: 'Monitoramento reiniciado com sucesso' })
  async restartMonitoring(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      this.logger.log(`Reiniciando monitoramento para serviço ID: ${serviceId}`);
      
      // Para o monitoramento atual
      await this.monitorsService.removeService(serviceId);
      
      // Aguarda um momento e reinicia
      setTimeout(async () => {
        await this.monitorsService.addService(serviceId);
      }, 1000);
      
      return {
        success: true,
        message: `Monitoramento reiniciado para serviço ${serviceId}`,
        serviceId,
        timestamp: new Date(),
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao reiniciar monitoramento: ${errorMessage}`);
      throw new BadRequestException('Erro ao reiniciar monitoramento');
    }
  }

   /**
   * Lista todos os monitores ativos
   */
  @Get('active')
  @ApiOperation({ summary: 'Listar todos os monitores ativos' })
  @ApiResponse({ status: 200, description: 'Lista de monitores ativos' })
  async getActiveMonitors() {
    try {
      const stats = this.monitorsService.getMonitoringStats();
      
      return {
        success: true,
        data: {
          totalActiveMonitors: stats.activeMonitors,
          monitoredServices: stats.monitoredServices,
          timestamp: new Date(),
        },
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao obter monitores ativos: ${errorMessage}`);
      throw new BadRequestException('Erro ao obter monitores ativos');
    }
  }

  /**
   * Obtém status específico do monitor de um serviço
   */
  @Get('service/:serviceId/status')
  @ApiOperation({ summary: 'Obter status do monitor de um serviço' })
  @ApiResponse({ status: 200, description: 'Status do monitor' })
  async getServiceMonitorStatus(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      const stats = this.monitorsService.getMonitoringStats();
      const isActive = stats.monitoredServices.includes(serviceId);
      
      return {
        success: true,
        data: {
          serviceId,
          isMonitored: isActive,
          status: isActive ? 'ACTIVE' : 'INACTIVE',
          timestamp: new Date(),
        },
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao obter status do monitor: ${errorMessage}`);
      throw new BadRequestException('Erro ao obter status do monitor');
    }
  }

  /**
   * Health check do sistema de monitoramento
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check do sistema de monitoramento' })
  @ApiResponse({ status: 200, description: 'Status de saúde do sistema' })
  async getMonitoringHealth() {
    try {
      const stats = this.monitorsService.getMonitoringStats();
      
      return {
        success: true,
        healthy: true,
        data: {
          systemStatus: 'HEALTHY',
          activeMonitors: stats.activeMonitors,
          totalServices: stats.monitoredServices.length,
          uptime: process.uptime(),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const errorMessage = ifUndefined(error);
      this.logger.error(`Erro no health check: ${errorMessage}`);
      return {
        success: false,
        healthy: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

   /**
   * Testa webhook específico
   */
  @Post('test/webhook')
  @ApiOperation({ summary: 'Testar webhook específico' })
  @ApiResponse({ status: 200, description: 'Resultado do teste de webhook' })
  async testWebhook(@Body() body: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    expectedStatusCodes?: number[];
    timeout?: number;
  }) {
    try {
      this.logger.log(`Testando webhook: ${body.url}`);
      
      const mockService = {
        id: 0,
        name: 'Teste Webhook',
        endpoint: body.url,
      };

      const config = {
        method: body.method || 'GET',
        headers: JSON.stringify(body.headers || {}),
        body: body.body || null,
        expectedStatusCodes: JSON.stringify(body.expectedStatusCodes || [200, 201, 202, 204]),
        timeout: body.timeout || 5000,
      };

      const result = await this.webhookService.monitor(mockService, config);

      return {
        success: true,
        webhook: body.url,
        result,
        timestamp: new Date(),
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro no teste de webhook: ${errorMessage}`);
      throw new BadRequestException('Erro no teste de webhook');
    }
  }

    /**
   * Testa SSL/TLS de um serviço
   */
  @Post('test/ssl/:serviceId')
  @ApiOperation({ summary: 'Testar SSL/TLS de um serviço' })
  @ApiResponse({ status: 200, description: 'Resultado do teste SSL' })
  async testSSL(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      this.logger.log(`Testando SSL para serviço ID: ${serviceId}`);
      
      // Mock service para teste SSL
      const service = await this.monitorsService.getServiceById(serviceId);
      const mockService = {
        id: serviceId,
        name: `SSL Test Service ${serviceId}`,
        endpoint: service.endpoint,
      };

      const sslResult = await this.webhookService.checkSSLCertificate(mockService);

      return {
        success: true,
        serviceId,
        sslCheck: sslResult,
        timestamp: new Date(),
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro no teste SSL: ${errorMessage}`);
      throw new BadRequestException('Erro no teste SSL');
    }
  }

  /**
   * Força limpeza de métricas antigas
   */
  @Post('cleanup/metrics')
  @ApiOperation({ summary: 'Forçar limpeza de métricas antigas' })
  @ApiResponse({ status: 200, description: 'Limpeza executada com sucesso' })
  async cleanupMetrics(@Body() body: { days?: number }) {
    try {
      const days = body.days || 30;
      this.logger.log(`Iniciando limpeza de métricas com mais de ${days} dias`);
      
      await this.monitorsService.cleanupOldMetrics();
      
      return {
        success: true,
        message: `Limpeza de métricas executada (${days} dias)`,
        timestamp: new Date(),
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro na limpeza de métricas: ${errorMessage}`);
      throw new BadRequestException('Erro na limpeza de métricas');
    }
  }

  /**
   * Recarrega todos os monitores
   */
  @Post('reload')
  @ApiOperation({ summary: 'Recarregar todos os monitores' })
  @ApiResponse({ status: 200, description: 'Monitores recarregados com sucesso' })
  async reloadMonitors() {
    try {
      this.logger.log('Recarregando todos os monitores...');
      
      // Para todos os monitores ativos
      const stats = this.monitorsService.getMonitoringStats();
      for (const serviceId of stats.monitoredServices) {
        await this.monitorsService.removeService(serviceId);
      }

      // Aguarda um momento e reinicializa
      setTimeout(async () => {
        await this.monitorsService.onModuleInit();
      }, 2000);
      
      return {
        success: true,
        message: 'Todos os monitores foram recarregados',
        previousActiveMonitors: stats.activeMonitors,
        timestamp: new Date(),
      };
    } catch (error) {
       const errorMessage = ifUndefined(error);
      this.logger.error(`Erro ao recarregar monitores: ${errorMessage}`);
      throw new BadRequestException('Erro ao recarregar monitores');
    }
  }


  /**
   * Testa múltiplos endpoints HTTP
   */
  @Post('test/multiple-http')
  @ApiOperation({ summary: 'Testar múltiplos endpoints HTTP' })
  @ApiResponse({ status: 200, description: 'Resultados dos testes HTTP' })
  async testMultipleHttp(@Body() body: { 
    endpoints: Array<{
      url: string;
      method?: string;
      expectedStatus?: number;
    }> 
  }) {
    const { endpoints } = body;
    const results: Array<{
      url: string;
      success: boolean;
      latency?: number;
      status?: number;
      error?: string;
      timestamp: Date;
    }> = [];

    for (const endpoint of endpoints) {
      try {
        const mockService = {
          id: 0,
          name: 'HTTP Test',
          endpoint: endpoint.url,
        };

        const config = {
          method: endpoint.method || 'GET',
          expectedStatusCodes: JSON.stringify([endpoint.expectedStatus || 200]),
          timeout: 5000,
        };

        const result = await this.webhookService.monitor(mockService, config);
        
        results.push({
          url: endpoint.url,
          success: result.status === 'UP',
          latency: result.latency,
          status: result.metrics?.httpStatus,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = ifUndefined(error);
        results.push({
          url: endpoint.url,
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    return {
      total: endpoints.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      timestamp: new Date(),
    };
  }

}

function ifUndefined(error: unknown) {
  return typeof error === 'object' && error !== null && 'message' in error
    ? (error as { message?: string; }).message
    : String(error);
}
