import { Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [PingModule, HttpModule],
  exports: [PingModule, HttpModule],
})
export class ServicesModule {}
