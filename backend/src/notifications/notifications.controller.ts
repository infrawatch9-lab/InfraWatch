import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { $Enums } from '@prisma/client';
import { CreateAlertChannelDto } from './notifications.entity'
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notifications : NotificationsService
    ) {}

@Post()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiOperation({ summary: 'Cadastrar canais de alertas' })
@ApiResponse({ status: 201, description: 'Canal de alerta cadastrado com sucesso' })
create(
    @Body() createAlertChannelDto : CreateAlertChannelDto,
) {
    console.log(`${createAlertChannelDto}`);
    console.log("Criando os servicos");
}

@Get()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiOperation({ summary: 'pegar canais de alertas' })
@ApiResponse({ status: 201, description: 'Canais de alertas' })
async findAll() {
  console.log("Fetching all channels");
  return ({ message: "okay " });
}
};