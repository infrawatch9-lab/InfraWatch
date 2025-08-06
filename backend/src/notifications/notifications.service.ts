import { Injectable, Logger } from '@nestjs/common';
import { AlertLevel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendAlert(alert: any, severity: AlertLevel): Promise<void> {
    this.logger.log(`Enviando alerta: ${alert.message} (${severity})`);

    // Por agora, apenas log - implementar integrações reais depois
    switch (severity) {
      case AlertLevel.CRITICAL:
        this.logger.error(`🚨 CRÍTICO: ${alert.message}`);
        break;
      case AlertLevel.WARNING:
        this.logger.warn(`⚠️ AVISO: ${alert.message}`);
        break;
      case AlertLevel.INFO:
        this.logger.log(`ℹ️ INFO: ${alert.message}`);
        break;
    }
  }
}