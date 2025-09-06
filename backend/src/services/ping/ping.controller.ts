import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PingService } from './ping.service';
import {
  CreatePingServiceDto,
} from './ping.entity';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@ApiTags('ping')
@Controller('ping')
export class PingController {
  private readonly logger = new Logger(PingController.name);

  constructor(private readonly pingService: PingService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cadastrar novo serviço Ping' })
  @ApiResponse({ status: 201, description: 'Serviço Ping criado com sucesso' })
  create(@Body() createPingDto: CreatePingServiceDto) {
    return this.pingService.createPingService(createPingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços Ping' })
  findAll() {
    return this.pingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um serviço Ping pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pingService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar configuração de um serviço Ping' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePingDto: CreatePingServiceDto,
  ) {
    return this.pingService.update(id, updatePingDto);
  }

  @Put('status/:id')
  @ApiOperation({ summary: 'Ativar/Desativar um serviço Ping' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'ACTIVE' | 'INACTIVE',
    @Body('action') action: 'resume' | 'pause',
  ) {
    return this.pingService.updateStatus(id, status, action);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover serviço Ping pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pingService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Remover todos os serviços Ping' })
  removeAll() {
    return this.pingService.removeAll();
  }

  @Get(':id/checkcle-status')
  @ApiOperation({ summary: 'Buscar status do serviço no CheckCle' })
  @ApiResponse({ status: 200, description: 'Status do serviço no CheckCle.' })
  getCheckcleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.pingService.getCheckcleServiceStatus(id);
  }

  @Get(':id/merged')
  @ApiOperation({ summary: 'Buscar serviço com dados do banco + CheckCle merged' })
  @ApiResponse({ 
    status: 200, 
    description: 'Serviço com dados do banco de dados mesclados com dados em tempo real do CheckCle.',
    schema: {
      example: {
        id: 11,
        name: "postgres",
        type: "PING",
        status: "ACTIVE",
        description: "Monitoramento do servidor de banco de dados principal - PostgreSQL",
        targetSLA: 99.9,
        lastChecked: "2025-09-06T11:34:17.000Z",
        responseTime: 11,
        uptime: 0,
        team: {
          id: 2,
          name: "Team 2"
        },
        usersToNotify: [
          {
            id: 1,
            name: "Watch Dog",
            email: "gkombadev@gmail.com",
            role: "VIEWER"
          }
        ]
      }
    }
  })
  getMergedServiceData(@Param('id', ParseIntPipe) id: number) {
    return this.pingService.findOne(id);
  }

  @Get('sync-checkcle-status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Sincronizar status de todos os serviços com CheckCle' })
  @ApiResponse({ status: 200, description: 'Status sincronizado com CheckCle.' })
  syncAllCheckcleStatus() {
    return this.pingService.syncAllServicesStatus();
  }
}
