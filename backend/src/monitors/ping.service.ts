import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MonitorResult } from './interfaces/monitor.interface';
import { ServiceStatus } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  async monitor(service: any, config: any): Promise<MonitorResult> {
    const startTime = Date.now();

    try {
      // Extrai hostname/IP do endpoint
      const hostname = this.extractHostname(service.endpoint);
      
      this.logger.debug(`Fazendo ping para ${hostname} (serviço: ${service.name})`);

      // Executa ping com timeout
      const command = this.buildPingCommand(hostname, config.timeout || 5000);
      const { stdout, stderr } = await execAsync(command);
      
      const latency = this.extractLatency(stdout);
      
      this.logger.log(`✅ Ping OK para ${service.name}: ${latency}ms`);

      return {
        serviceId: service.id,
        status: ServiceStatus.UP,
        latency: latency || Date.now() - startTime,
        timestamp: new Date(),
        metrics: {
          pingLatency: latency || undefined,
          hostname: hostname,
        }
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error(`❌ Ping falhou para ${service.name} (${error.message})`);

      return {
        serviceId: service.id,
        status: ServiceStatus.DOWN,
        latency,
        errorMessage: error.message,
        timestamp: new Date(),
        metrics: {
          hostname: this.extractHostname(service.endpoint),
          errorCode: error.code,
        }
      };
    }
  }

  private buildPingCommand(hostname: string, timeout: number): string {
    const timeoutSeconds = Math.ceil(timeout / 1000);
    
    if (process.platform === 'win32') {
      return `ping -n 1 -w ${timeout} ${hostname}`;
    } else {
      return `ping -c 1 -W ${timeoutSeconds} ${hostname}`;
    }
  }

  private extractHostname(endpoint: string): string {
    try {
      // Remove protocolo se existir
      const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
      // Remove porta se existir
      const hostname = cleanEndpoint.split(':')[0];
      // Remove path se existir
      return hostname.split('/')[0];
    } catch {
      return endpoint;
    }
  }

  private extractLatency(pingOutput: string): number | null {
    // Para sistemas Unix/Linux
    const unixMatch = pingOutput.match(/time[<=](\d+\.?\d*)/);
    if (unixMatch) {
      return parseFloat(unixMatch[1]);
    }

    // Para Windows
    const windowsMatch = pingOutput.match(/Average = (\d+)ms/);
    if (windowsMatch) {
      return parseInt(windowsMatch[1], 10);
    }

    // Tentar outros padrões
    const timeMatch = pingOutput.match(/(\d+\.?\d*)\s*ms/);
    if (timeMatch) {
      return parseFloat(timeMatch[1]);
    }

    return null;
  }

  /**
   * Testa conectividade simples sem salvar no banco
   */
  async testConnectivity(hostname: string, timeout: number = 5000): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const command = this.buildPingCommand(hostname, timeout);
      const { stdout } = await execAsync(command);
      const latency = this.extractLatency(stdout);

      return {
        success: true,
        latency: latency || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}