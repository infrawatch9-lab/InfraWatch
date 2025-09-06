import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controler';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsManagerModule } from '../../notifications/notifications-manager.module';

@Module({
  imports: [DatabaseModule, NotificationsManagerModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})

export class WebhookModule {}