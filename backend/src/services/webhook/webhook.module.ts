import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controler';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../../database/database.module';
import { MicroservicesModule } from '../../ws/ws.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, MicroservicesModule, NotificationsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})

export class WebhookModule {}