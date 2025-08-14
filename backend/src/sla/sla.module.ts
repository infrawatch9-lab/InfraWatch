import { Module } from '@nestjs/common';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';
import { PDFReportModule } from './pdf-report.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, PDFReportModule],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService, PDFReportModule],
})
export class SlaModule {}
