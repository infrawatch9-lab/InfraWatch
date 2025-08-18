import { Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';
import { SnmpModule } from './snmp/snmp.module';
import { WebhookModule } from './webhook/webhook.module';


@Module({
  imports: [PingModule, HttpModule, SnmpModule, WebhookModule],
  exports: [PingModule, HttpModule, SnmpModule, WebhookModule],
})
export class ServicesModule {}
