import { forwardRef, Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';
import { SnmpModule } from './snmp/snmp.module';
import { WebhookModule } from './webhook/webhook.module';
import { ServicesController } from './services.controller';

@Module({
  imports: [PingModule, HttpModule, SnmpModule, WebhookModule],
  exports: [PingModule, HttpModule, SnmpModule, WebhookModule],
  controllers: [ServicesController],
  providers: [],
})
export class ServicesModule {}
