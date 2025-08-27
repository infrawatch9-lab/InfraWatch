import { Injectable } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
import { SlackService } from './slack.service';
import { CreateAlertChannelDto } from './notifications.entity';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
    private readonly slackService: SlackService,
    private readonly prisma : PrismaService,
  ) {}

  async sendAlert(message: string, to: string[]) {
    const subject = '🚨 Alerta de Serviço';
    const html = '<b>' + message + '</b>';

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

  async sendNotificationToEmail(
    message: string,
    subject: string,
    html: string,
    to: string[],
  ) {
    await this.emailService.send(message, subject, html, to);
    console.log('Alerta enviado para o Email:', message);
  }

  async create( CreateDto: CreateAlertChannelDto) : Promise<any> {
    try {
      const notification = await this.prisma.notificationsConfig.create({
        data: {
          
        }
      });



      if (notification)
      {
        console.log(`${notification}`);
      }
      return ({ notification } );
    } catch {
        console.error("falha no cadastro de servicos");
        throw Error ("Falha No cadastro de Servicos");
    }
  }

  async findAll ()
  {
    try {
      return (
        await this.prisma.notificationsConfig.findMany(

        )
      )
    } catch {
        console.error("falha ao pegar todos os servicos");
        throw Error ("Falha ao pegar todos os servicos");      
    }
  }
}
