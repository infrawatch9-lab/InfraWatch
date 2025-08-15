import { forwardRef, Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { HttpModule } from './http/http.module';
import { MonitorsModule } from '../monitors/monitors.module';

@Module({
  imports: [PingModule, HttpModule, forwardRef(() => MonitorsModule)],
  exports: [PingModule, HttpModule, forwardRef(() => MonitorsModule)],
})
export class ServicesModule {}
