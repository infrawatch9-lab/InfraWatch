import { Injectable, Logger } from '@nestjs/common';
import { MonitorResult } from './interfaces/monitor.interface';
import { ServiceStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async monitor(service: any, config: any): Promise<MonitorResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || 5000,
      );
      const h = {
          'User-Agent': 'InfraWatch-Monitor/1.0',
          Accept: 'application/json',
          ...(config.headers && this.parseHeaders(config.headers)),
        };
        
      this.logger.debug(`Fazendo request para ${service.endpoint} (serviço: ${service.name})`);
      
      const response = await fetch(service.endpoint, {
        method: config.method || 'GET',
        headers: h,
        body: config.body ? this.parseBody(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      // Verifica se a resposta está dentro dos códigos de status esperados
      const expectedStatusCodes = config.expectedStatusCodes
        ? this.parseExpectedStatusCodes(config.expectedStatusCodes)
        : [200, 201, 202, 204];

      const isSuccess = expectedStatusCodes.includes(response.status);

      // Extrai métricas adicionais dos headers e corpo da resposta
      const metrics = await this.extractResponseMetrics(response);
      if (isSuccess)
        this.logger.log(`✅ Request OK para ${service.name}: ${latency}ms`);

      return {
        serviceId: service.id,
        status: isSuccess ? ServiceStatus.UP : ServiceStatus.DOWN,
        latency,
        timestamp: new Date(),
        metrics: {
          httpStatus: response.status,
          responseSize: parseInt(response.headers.get('content-length') || '0'),
          ...metrics,
        },
        errorMessage: !isSuccess
          ? `HTTP ${response.status}: ${response.statusText}`
          : undefined,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      let errorMessage = (error as Error).message;
      if ((error as Error).name === 'AbortError') {
        errorMessage = `Timeout após ${config.timeout || 5000}ms`;
      } else if (typeof (error as any).code === 'string' && (error as any).code === 'ENOTFOUND') {
        errorMessage = `Host não encontrado: ${service.endpoint}`;
      } else if (typeof (error as any).code === 'string' && (error as any).code === 'ECONNREFUSED') {
        errorMessage = `Conexão recusada: ${service.endpoint}`;
      }

      this.logger.error(
        `HTTP monitor falhou para ${service.name}:`,
        errorMessage,
      );

      return {
        serviceId: service.id,
        status: ServiceStatus.DOWN,
        latency,
        errorMessage,
        timestamp: new Date(),
      };
    }
  }

  private parseHeaders(headers: string): Record<string, string> {
    try {
      return JSON.parse(headers);
    } catch {
      return {};
    }
  }

  private parseBody(body: string): string {
    try {
      return JSON.stringify(JSON.parse(body));
    } catch {
      return body;
    }
  }

  private parseExpectedStatusCodes(codes: string): number[] {
    try {
      return JSON.parse(codes);
    } catch {
      return [200];
    }
  }

  private async extractResponseMetrics(
    response: Response,
  ): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      // Tenta extrair métricas do corpo da resposta (se for JSON)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const responseData = await response.clone().json();

        // Procura por campos comuns de métricas
        if (responseData.metrics) {
          Object.assign(metrics, responseData.metrics);
        }

        if (responseData.performance) {
          Object.assign(metrics, responseData.performance);
        }

        // Campos específicos de APIs de monitoramento
        ['cpu', 'memory', 'disk', 'load', 'uptime'].forEach((key) => {
          if (responseData[key] !== undefined) {
            metrics[key] = responseData[key];
          }
        });
      }

      // Extrai métricas dos headers de resposta
      const serverTiming = response.headers.get('server-timing');
      if (serverTiming) {
        metrics.serverTiming = this.parseServerTiming(serverTiming);
      }
    } catch (error) {
      // Ignora erros de parsing - nem todas as APIs retornam JSON válido
      this.logger.debug(
        'Não foi possível extrair métricas da resposta:',
        (error as Error).message,
      );
    }

    return metrics;
  }

  private parseServerTiming(serverTiming: string): Record<string, number> {
    const timing: Record<string, number> = {};

    try {
      const entries = serverTiming.split(',');
      entries.forEach((entry) => {
        const [name, duration] = entry.trim().split(';dur=');
        if (name && duration) {
          timing[name] = parseFloat(duration);
        }
      });
    } catch (error) {
      this.logger.debug('Erro ao parsear Server-Timing:', (error as Error).message);
    }

    return timing;
  }

  /**
   * Monitora webhook específico (POST com payload)
   */
  async monitorWebhook(
    service: any,
    config: any,
    payload?: any,
  ): Promise<MonitorResult> {
    const webhookConfig = {
      ...config,
      method: 'POST',
      body: JSON.stringify(
        payload || {
          timestamp: new Date().toISOString(),
          service: service.name,
          type: 'health_check',
          from: 'InfraWatch',
        },
      ),
      headers: JSON.stringify({
        'Content-Type': 'application/json',
        ...(config.headers && this.parseHeaders(config.headers)),
      }),
    };

    return this.monitor(service, webhookConfig);
  }

  /**
   * Verifica SSL/TLS do endpoint
   */
  async checkSSLCertificate(service: any): Promise<Record<string, any>> {
    try {
      const url = new URL(service.endpoint);

      if (url.protocol === 'https:') {
        // Para Node.js, verificação básica de certificado
        const response = await fetch(service.endpoint, {
          method: 'HEAD',
          headers: { 'User-Agent': 'InfraWatch-SSL-Check/1.0' },
        });

        return {
          valid: response.ok,
          protocol: 'TLS',
          status: response.status,
        };
      }

      return { valid: false, reason: 'Not HTTPS' };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }
}
