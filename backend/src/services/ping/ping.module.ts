import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';
import { DatabaseModule } from '../../database/database.module';
import { MicroservicesModule } from '../../ws/ws.module';

@Module({
  imports: [DatabaseModule, MicroservicesModule],
  controllers: [PingController],
  providers: [PingService],
  exports: [PingService],
})

export class PingModule {}