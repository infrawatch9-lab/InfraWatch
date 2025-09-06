import { forwardRef, Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';
import { SnmpModule } from './snmp/snmp.module';
import { WebhookModule } from './webhook/webhook.module';
import { ServicesController } from './services.controller';
import { PrismaService } from '../database/prisma.service';
import { CheckcleAuthModule } from '../auth/checkCle/checkcle-auth.module';

@Module({
  imports: [PingModule, HttpModule, SnmpModule, WebhookModule, CheckcleAuthModule],
  exports: [PingModule, HttpModule, SnmpModule, WebhookModule, CheckcleAuthModule],
  controllers: [ServicesController],
  providers: [PrismaService],
})
export class ServicesModule {}
