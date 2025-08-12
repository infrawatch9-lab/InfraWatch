import { Module } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { MonitorsController } from './monitors.controller';
import { PingService } from './ping.service';
import { SnmpService } from './snmp.service';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MonitorsController],
  providers: [MonitorsService, PingService, SnmpService, WebhookService],
  exports: [MonitorsService, PingService, SnmpService, WebhookService],
})
export class MonitorsModule {}