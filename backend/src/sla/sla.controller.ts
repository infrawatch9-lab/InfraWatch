import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SlaService } from './sla.service';
import { Public } from '../auth/public.decorator';

@Controller('api/sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Post('calculate')
  @Public()
  async calculateSLA(@Body() body: { serviceId: number; startDate: string; endDate: string }) {
    const { serviceId, startDate, endDate } = body;
    return await this.slaService.calculateSLA(
      serviceId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('summary/:serviceId')
  @Public()
  async getSLASummary(@Param('serviceId') serviceId: string) {
    return await this.slaService.getSLASummary(parseInt(serviceId));
  }

  @Get('summary')
  @Public()
  async getAllSLASummary() {
    return await this.slaService.getAllSLASummary();
  }

  @Get('today/:serviceId')
  @Public()
  async getTodaySLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getTodaySLA(parseInt(serviceId));
  }

  @Get('current-month/:serviceId')
  @Public()
  async getCurrentMonthSLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getCurrentMonthSLA(parseInt(serviceId));
  }

  @Get('last-week/:serviceId')
  @Public()
  async getLastWeekSLA(@Param('serviceId') serviceId: string) {
    return await this.slaService.getLastWeekSLA(parseInt(serviceId));
  }
}
