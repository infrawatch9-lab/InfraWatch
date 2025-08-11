import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications/notifications.service';
import { Public } from './auth/public.decorator';

@Controller('health')
export class AppController {
  @Get()
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
}
