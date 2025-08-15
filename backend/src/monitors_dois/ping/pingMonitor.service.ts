import { Injectable, Logger } from '@nestjs/common';
import * as ping from 'ping';
import { PingService } from '../../services/ping/ping.service';

@Injectable()
export class PingHandler {
  private readonly logger = new Logger(PingHandler.name);

  constructor(private readonly pingService: PingService) {}

  async start(service: any) {
    const fullService = await this.pingService.findOneEspecifico(
      service.id,
      ['configs', 'alerts', 'usersToNotify', 'rules', 'metrics'],
      'PingConfig'
    );

    this.logger.log(`Retrieved service configuration:`);
    console.log("\n=========================\n");
    console.log(JSON.stringify(fullService, null, 2));
    console.log("\n=========================\n");


    const pingCfg = fullService.configs[0]?.PingConfig;
    if (!pingCfg) {
      this.logger.warn(`Serviço ${service.name} sem configuração de PING`);
      return;
    }

    this.logger.log(`Iniciando monitoramento PING para ${fullService.name} (${pingCfg.ipAddress})`);

    // Executa o primeiro ping imediatamente
    await this.runPing(fullService.name, pingCfg.ipAddress);

    // O setInterval será gerenciado pelo monitor.utils.ts, não aqui
    // Removendo o setInterval duplicado
  }

  private async runPing(name: string, ip: string) {
    try {
      const res = await ping.promise.probe(ip, {
        timeout: 5,
        extra: ['-c', '1'], // envia apenas 1 pacote
      });

      if (res.alive) {
        this.logger.log(`✅ ${name} (${ip}) está online - Latência: ${res.time} ms`);
      } else {
        this.logger.warn(`❌ ${name} (${ip}) está offline`);
      }
    } catch (error) {
      this.logger.error(`Erro ao pingar ${ip}:`, error);
    }
  }
}
