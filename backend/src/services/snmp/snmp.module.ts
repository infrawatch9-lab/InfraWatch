import { Module } from '@nestjs/common';
import { SnmpController } from './snmp.controler';
import { SnmpService } from './snmp.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SnmpController],
  providers: [SnmpService],
  exports: [SnmpService],
})

export class SnmpModule {}