import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
import { SlackService } from './slack.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [HttpModule],
  providers: [
    NotificationsService,
    TelegramService,
    EmailService,
    SlackService,
    PrismaService
  ],
  controllers: [ NotificationsController],
  exports: [NotificationsService, EmailService],
})

export class NotificationsModule {}
