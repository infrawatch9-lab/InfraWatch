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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SnmpService } from './snmp/snmp.service';
import { WebhookService } from './webhook/webhook.service';
import { PingService } from './ping/ping.service';
import { HttpService } from './http/http.service';
import { BaseServiceDto, CreateServiceDto } from './service.common-entity'


@ApiTags('services')
@Controller('services')
export class ServicesController {
    constructor(
        private readonly snmpService: SnmpService,
        private readonly webhookService: WebhookService,
        private readonly pingService: PingService,
        private readonly httpService: HttpService,
    ) {}

@Post()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiOperation({ summary: 'Cadastrar novo serviço' })
@ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
create(
  @Body()
  @Body() createServiceDto: CreateServiceDto,
) {
  switch (createServiceDto.type) {
    case 'SNMP':
      return this.snmpService.create(createServiceDto);
    case 'WEBHOOK':
      return this.webhookService.create(createServiceDto);
    case 'PING':
      return this.pingService.createPingService(createServiceDto);
    case 'HTTP':
      return this.httpService.create(createServiceDto);
    default:
      throw new BadRequestException(`Tipo de serviço não suportado`);
  }
}


@Get()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Lista de serviços' })
@ApiResponse({ status: 404, description: 'Serviços não encontrados' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiOperation({ summary: 'Listar todos os serviços' })
async findAll() {
  console.log("Fetching all services");

  const [snmp, webhook, ping, http] = await Promise.all([
    this.snmpService.findAll(),
    this.webhookService.findAll(),
    this.pingService.findAll(),
    this.httpService.findAll(),
  ]);

  return { snmp, webhook, ping, http };
}

@Get(':id')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Serviço encontrado'})
@ApiResponse({ status: 404, description: 'Serviço não encontrado' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiOperation({ summary: 'Obter um serviço pelo ID' })
async findOne(@Param('id', ParseIntPipe) id: number) {
  const [snmp, webhook, ping, http] = await Promise.all([
    this.snmpService.findOne(id),
    this.webhookService.findOne(id),
    this.pingService.findOne(id),
    this.httpService.findOne(id),
  ]);

  return { snmp, webhook, ping, http };
}

@Put(':id')
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
@ApiResponse({ status: 404, description: 'Serviço não encontrado' })
@ApiResponse({ status: 400, description: 'Erro ao atualizar serviço' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiOperation({ summary: 'Atualizar configuração de um serviço' })
update(@Param('id', ParseIntPipe) id: number, @Body() createServiceDto: CreateServiceDto) {
    switch (createServiceDto.type) {
        case 'SNMP':
            return this.snmpService.update(id, createServiceDto);
        case 'WEBHOOK':
            return this.webhookService.update(id, createServiceDto);
        case 'PING':
            return this.pingService.update(id, createServiceDto);
        case 'HTTP':
            return this.httpService.update(id, createServiceDto);
        default:
            throw new BadRequestException(`Tipo de serviço não suportado`);
    }
}

@Delete(':id')
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
@ApiResponse({ status: 404, description: 'Serviço não encontrado' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiResponse({ status: 400, description: 'Erro ao remover serviço' })
@ApiResponse({ status: 403, description: 'Acesso negado' })
@ApiOperation({ summary: 'Remover serviço pelo ID' })
remove(@Param('id', ParseIntPipe) id: number) {
    return {
        snmp: this.snmpService.remove(id),
        webhook: this.webhookService.remove(id),
        ping: this.pingService.remove(id),
        http: this.httpService.remove(id),
    };
}

@Delete()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
@ApiResponse({ status: 404, description: 'Serviço não encontrado' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiResponse({ status: 400, description: 'Erro ao remover serviço' })
@ApiResponse({ status: 403, description: 'Acesso negado' })
@ApiOperation({ summary: 'Remover todos os serviços' })
removeAll() {
    return {
        snmp: this.snmpService.removeAll(),
        webhook: this.webhookService.removeAll(),
        ping: this.pingService.removeAll(),
        http: this.httpService.removeAll(),
    };
}
}
