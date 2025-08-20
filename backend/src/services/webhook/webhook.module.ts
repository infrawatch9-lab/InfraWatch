import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controler';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})

export class WebhookModule {}