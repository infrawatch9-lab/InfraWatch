import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications/notifications.service';
import { Public } from './auth/public.decorator';

@Controller('health')
export class AppController {
  @Get()
  @Public()
  getHealth() {
    return {
      success: true,
      message: 'InfraWatch API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('send-alert')
  @Public()
  async sendAlert() {
    const message = 'Alerta de teste enviado!';
    await this.notificationsService.sendAlert(message, 'gkombadev@gmail.com');
    return { success: true, message: 'Alertas enviados com sucesso!' };
  }

  @Get('test-telegram')
  async testTelegram() {
    const message = '📱 Teste específico do Telegram - Sistema InfraWatch';
    await this.notificationsService.sendNotificationToTelegram(message);
    return { success: true, message: 'Teste Telegram enviado!' };
  }

  @Get('test-email')
  async testEmail() {
    const message = '📧 Teste específico do Email - Sistema InfraWatch';
    const subject = '✅ Teste Email InfraWatch';
    const html =
      '<h1>🔔 Teste de Email</h1><p><strong>Mensagem:</strong> ' +
      message +
      '</p>';
    const to = 'vicor32leonel@gmail.com';

    await this.notificationsService.sendNotificationToEmail(
      message,
      subject,
      html,
      to,
    );
    return { success: true, message: 'Teste Email enviado!' };
  }

  @Get('test-slack')
  async testSlack() {
    const message = '🔔 Teste específico do Slack - Sistema InfraWatch';
    try {
      await this.notificationsService.sendNotificationToSlack(message);
      return { success: true, message: 'Teste Slack enviado!' };
    } catch (error) {
      return {
        success: false,
        message:
          'Erro no Slack: ' +
          (error instanceof Error ? error.message : String(error)),
      };
    }
  }
}
