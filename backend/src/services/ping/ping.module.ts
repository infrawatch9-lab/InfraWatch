import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';
import { PingCheckcleService } from './ping-checkcle.service';
import { PingDatabaseService } from './ping-database.service';
import { PingOrchestrationService } from './ping-orchestration.service';
import { DatabaseModule } from '../../database/database.module';
import { CheckcleAuthModule } from '../../auth/checkCle';


@Module({
  imports: [DatabaseModule, CheckcleAuthModule],
  controllers: [PingController],
  providers: [
    PingService,
    PingCheckcleService,
    PingDatabaseService,
    PingOrchestrationService,
  ],
  exports: [
    PingService,
    PingCheckcleService,
    PingDatabaseService,
    PingOrchestrationService,
  ],
})

export class PingModule {}