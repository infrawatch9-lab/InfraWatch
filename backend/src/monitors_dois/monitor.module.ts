import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MonitorsService } from './monitor.service';
import { PingHandler } from './ping/pingMonitor.service';
import { HttpHandler } from './http/httpMonitor.service';
import { SnmpHandler } from './snmp/snmpMonitor.service';
import { WebhookHandler } from './webhook/webhookMonitor.service';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    forwardRef(() => ServicesModule)
  ],
  providers: [
    PrismaService,
    MonitorsService,
    PingHandler,
    HttpHandler,
    SnmpHandler,
    WebhookHandler,
  ],
  exports: [MonitorsService, PingHandler, HttpHandler, SnmpHandler, WebhookHandler],
})
export class MonitorsModule {}
