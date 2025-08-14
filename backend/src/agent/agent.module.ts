import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AgentController],
  providers: [],
})
export class AgentModule {}
