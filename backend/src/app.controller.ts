import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications/notifications.service';

@Controller('health')
export class AppController {
  @Get()
  @ApiResponse({
    status: 200,
    description: 'API health check',
    schema: {
      example: {
        success: true,
        message: 'InfraWatch API is running',
        timestamp: '2025-08-08T12:00:00.000Z',
        version: '1.0.0'
      }
    }
  })
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
  @ApiResponse({
    status: 200,
    description: 'Alert sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Alertas enviados com sucesso!'
      }
    }
  })
  async sendAlert() {
    const message = 'Alerta de teste enviado!';
    await this.notificationsService.sendAlert(message);
    return { success: true, message: 'Alertas enviados com sucesso!' };
  }
}
