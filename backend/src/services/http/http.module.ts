import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { HttpService } from './http.service';
import { DatabaseModule } from '../../database/database.module';
import { MicroservicesModule } from '../../ws/ws.module';

@Module({
  imports: [DatabaseModule, MicroservicesModule],
  controllers: [HttpController],
  providers: [HttpService],
  exports: [HttpService],
})
export class HttpModule {}
