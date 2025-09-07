import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { DatabaseModule } from '../database/database.module';
import { JwtService } from '../auth/jwt.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AgentsController],
  providers: [AgentsService, JwtService],
  exports: [AgentsService],
})
export class AgentsModule {}
