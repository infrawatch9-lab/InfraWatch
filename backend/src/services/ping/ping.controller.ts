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
}
