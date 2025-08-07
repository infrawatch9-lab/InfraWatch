import { Injectable } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
import { SlackService } from './slack.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
    private readonly slackService: SlackService,
  ) {}

  async sendAlert(message: string) {
    const subject = '🚨 Alerta de Serviço';
    const html = '<b>' + message + '</b>';
    const to = 'olamundoemjs@gmail.com';

    await this.telegramService.send(message);
    await this.emailService.send(message, subject, html, to);
    await this.slackService.send(message);
    console.log('Todos os alertas enviados:', message);
  }

  async sendNotificationToTelegram(message: string) {
    await this.telegramService.send(message);
    console.log('Alerta enviado para o Telegram:', message);
  }

  async sendNotificationToSlack(message: string) {
    await this.slackService.send(message);
    console.log('Alerta enviado para o Slack:', message);
  }

  async sendNotificationToEmail(message: string, subject: string, html: string, to: string) {
    await this.emailService.send(message, subject, html, to);
    console.log('Alerta enviado para o Email:', message);
  }
}