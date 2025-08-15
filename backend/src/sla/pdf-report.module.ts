import { Module } from '@nestjs/common';
import { PDFReportController } from './pdf-report.controller';
import { PDFReportService } from './pdf-report.service';
import { SlaService } from './sla.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PDFReportController],
  providers: [PDFReportService, SlaService],
  exports: [PDFReportService],
})
export class PDFReportModule {}
