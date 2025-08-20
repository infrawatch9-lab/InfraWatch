import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
    Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todos os dashboards' })
    @ApiResponse({ status: 200, description: 'Lista de dashboards' })
    findAll() {
        return this.dashboardService.findAll();
    }
    
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'USER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter um dashboard pelo ID' })
    @ApiResponse({ status: 200, description: 'Dashboard encontrado' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.dashboardService.findOne(id);
    }
}