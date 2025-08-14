import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SnmpHandler {
  private readonly logger = new Logger(SnmpHandler.name);

  async start(service: any) {
    const config = service.configs[0];
    if (!config) {
      this.logger.warn(`Serviço ${service.name} sem configuração de SNMP`);
      return;
    }

    this.logger.log(`Iniciando monitoramento SNMP para ${service.name}`);
    setInterval(() => {
      this.runSnmpCheck(config.ipAddress);
    }, config.interval * 1000);
  }

  private runSnmpCheck(ip: string) {
    this.logger.debug(`Verificando SNMP ${ip}...`);
  }
}
