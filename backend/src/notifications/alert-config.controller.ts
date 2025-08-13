import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { $Enums } from '@prisma/client';

@ApiTags('alert-config')
@Controller('alert-config')
export class AlertConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar configuração de alerta para um serviço' })
  @ApiResponse({ status: 201, description: 'Configuração de alerta criada' })
  async create(
    @Body() dto: { serviceId: number; field: string; condition: string; severity: string; active?: boolean },
    @Request() req: any
  ) {
    // Garante que a string recebida é um valor válido do enum AlertLevel
    const allowedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const severity: $Enums.AlertLevel = allowedSeverities.includes(dto.severity?.toUpperCase())
      ? (dto.severity.toUpperCase() as $Enums.AlertLevel)
      : 'LOW';
    // Supondo que o id do usuário está disponível em req.user.userId via JWT
    const alertRule = await this.prisma.alertRule.create({
      data: {
        serviceId: dto.serviceId,
        field: dto.field,
        condition: dto.condition,
        severity: severity,
        active: dto.active ?? true,
        createdBy: req.user.userId,
      },
    });
    return alertRule;
  }
}
