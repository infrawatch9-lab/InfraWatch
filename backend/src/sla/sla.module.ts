import { Module } from '@nestjs/common';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';
import { PDFReportModule } from './pdf-report.module';
import { DatabaseModule } from '../database/database.module';
import { CSVReportService } from './csv-report.service';
import { CSVReportController } from './csv-report.controller';

@Module({
  imports: [DatabaseModule, PDFReportModule],
  controllers: [SlaController, CSVReportController],
  providers: [SlaService, CSVReportService],
  exports: [SlaService, PDFReportModule, CSVReportService],
})
export class SlaModule {}
