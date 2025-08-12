import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SlaService } from './sla.service';
import { SLADto } from './sla.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('sla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Post('calculate')
  @Roles('ADMIN', 'USER')
  async calculateSLA(@Body() slaDto: SLADto) {
    try {
      const calculation = await this.slaService.calculateSLA(slaDto);
      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      console.error('Erro ao calcular SLA:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Post('save')
  @Roles('ADMIN')
  async saveSLA(@Body() slaDto: SLADto) {
    try {
      const calculation = await this.slaService.calculateSLA(slaDto);
      const savedSLA = await this.slaService.saveSLA(calculation);

      return {
        success: true,
        message: 'SLA salvo com sucesso',
        data: savedSLA,
      };
    } catch (error) {
      console.error('Erro ao salvar SLA:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('service/:serviceId')
  @Roles('ADMIN', 'USER')
  async getSLAByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNumber = limit ? parseInt(limit) : 10;
      const slas = await this.slaService.getSLAByService(
        serviceId,
        limitNumber,
      );

      return {
        success: true,
        data: slas,
      };
    } catch (error) {
      console.error('Erro ao buscar SLA por serviço:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('report/:serviceId')
  @Roles('ADMIN', 'USER')
  async getSLAReport(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    try {
      if (!periodStart || !periodEnd) {
        throw new Error('Parâmetros periodStart e periodEnd são obrigatórios');
      }

      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas fornecidas');
      }

      const report = await this.slaService.getSLAReport(
        serviceId,
        startDate,
        endDate,
      );

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error('Erro ao gerar relatório SLA:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro interno do servidor',
      );
    }
  }

  @Get('summary/:serviceId')
  @Roles('ADMIN', 'USER')
  async getSLASummary(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      const summary = await this.slaService.getSLASummary(serviceId);

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error('Erro ao buscar resumo SLA:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro interno do servidor',
      );
    }
  }

  @Get('trend/:serviceId')
  @Roles('ADMIN', 'USER')
  async getSLATrend(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('days') days?: string,
  ) {
    try {
      const daysNumber = days ? parseInt(days) : 30;

      if (daysNumber < 1 || daysNumber > 365) {
        throw new Error('Número de dias deve estar entre 1 e 365');
      }

      const trend = await this.slaService.getSLATrend(serviceId, daysNumber);

      return {
        success: true,
        data: trend,
      };
    } catch (error) {
      console.error('Erro ao buscar tendência SLA:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro interno do servidor',
      );
    }
  }

  @Get('summary')
  @Roles('ADMIN', 'USER')
  async getAllServicesSLASummary() {
    try {
      const summaries = await this.slaService.getAllServicesSLASummary();

      return {
        success: true,
        data: summaries,
        count: summaries.length,
      };
    } catch (error) {
      console.error('Erro ao buscar resumo SLA de todos os serviços:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Post('process-automatic')
  @Roles('ADMIN')
  async processAutomaticSLA() {
    try {
      await this.slaService.processAutomaticSLA();

      return {
        success: true,
        message: 'Processamento automático de SLA executado com sucesso',
      };
    } catch (error) {
      console.error('Erro no processamento automático de SLA:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  // Rotas de conveniência para períodos específicos
  @Get('today/:serviceId')
  @Roles('ADMIN', 'USER')
  async getTodaySLA(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const calculation = await this.slaService.calculateSLA({
        serviceId,
        periodStart: todayStart,
        periodEnd: now,
      });

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      console.error('Erro ao buscar SLA de hoje:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('current-month/:serviceId')
  @Roles('ADMIN', 'USER')
  async getCurrentMonthSLA(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculation = await this.slaService.calculateSLA({
        serviceId,
        periodStart: monthStart,
        periodEnd: now,
      });

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      console.error('Erro ao buscar SLA do mês atual:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  @Get('last-week/:serviceId')
  @Roles('ADMIN', 'USER')
  async getLastWeekSLA(@Param('serviceId', ParseIntPipe) serviceId: number) {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const calculation = await this.slaService.calculateSLA({
        serviceId,
        periodStart: weekStart,
        periodEnd: now,
      });

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      console.error('Erro ao buscar SLA da última semana:', error);
      throw new Error('Erro interno do servidor');
    }
  }
}
