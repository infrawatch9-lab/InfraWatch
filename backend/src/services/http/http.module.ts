import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { HttpService } from './http.service';
import { HttpCheckcleService } from './http-checkcle.service';
import { HttpDatabaseService } from './http-database.service';
import { HttpOrchestrationService } from './http-orchestration.service';
import { DatabaseModule } from '../../database/database.module';
import { CheckcleAuthModule } from '../../auth/checkCle';

@Module({
  imports: [DatabaseModule, CheckcleAuthModule],
  controllers: [HttpController],
  providers: [
    HttpService,
    HttpCheckcleService,
    HttpDatabaseService,
    HttpOrchestrationService,
  ],
  exports: [
    HttpService,
    HttpCheckcleService,
    HttpDatabaseService,
    HttpOrchestrationService,
  ],
})
export class HttpModule {}
