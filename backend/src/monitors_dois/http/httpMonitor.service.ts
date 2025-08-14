import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HttpHandler {
  private readonly logger = new Logger(HttpHandler.name);

  async start(service: any) {
    const config = service.configs[0];
    if (!config) {
      this.logger.warn(`Serviço ${service.name} sem configuração de HTTP`);
      return;
    }

    this.logger.log(`Iniciando monitoramento HTTP para ${service.name}`);
    setInterval(() => {
      this.runHttpCheck(config.ipAddress);
    }, config.interval * 1000);
  }

  private runHttpCheck(url: string) {
    // lógica real de verificação HTTP
    this.logger.debug(`Verificando ${url}...`);
  }
}
