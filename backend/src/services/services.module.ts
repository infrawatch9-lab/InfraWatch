import { Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';
import { SnmpModule } from './snmp/snmp.module';


@Module({
  imports: [PingModule, HttpModule, SnmpModule],
  exports: [PingModule, HttpModule, SnmpModule],
})
export class ServicesModule {}
