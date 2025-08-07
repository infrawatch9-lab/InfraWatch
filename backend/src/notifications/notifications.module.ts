// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
import { SlackService } from './slack.service';

@Module({
  imports: [HttpModule],
  providers: [
    NotificationsService,
    TelegramService,
    EmailService,
    SlackService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
