import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookHandler {
  private readonly logger = new Logger(WebhookHandler.name);

  async start(service: any) {
    const config = service.configs[0];
    if (!config) {
      this.logger.warn(`Serviço ${service.name} sem configuração de WEBHOOK`);
      return;
    }

    this.logger.log(`Iniciando monitoramento WEBHOOK para ${service.name}`);
    setInterval(() => {
      this.webhookRequest(config.ipAddress);
    }, config.interval * 1000);
  }

  private webhookRequest(ip: string) {
    // lógica real de webhook
    this.logger.debug(`Enviando requisição para ${ip}...`);
  }
}
