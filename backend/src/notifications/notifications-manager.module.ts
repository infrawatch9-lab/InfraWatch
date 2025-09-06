import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsManagerController } from './notifications-manager.controller';
import { NotificationsManagerService } from './notifications-manager.service';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { SlackService } from './slack.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [NotificationsManagerController],
  providers: [NotificationsManagerService, EmailService, TelegramService, SlackService],
  exports: [NotificationsManagerService, EmailService, TelegramService, SlackService]
})
export class NotificationsManagerModule {}
