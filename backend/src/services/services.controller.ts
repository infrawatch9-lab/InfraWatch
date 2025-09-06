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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SnmpService } from './snmp/snmp.service';
import { WebhookService } from './webhook/webhook.service';
import { PingService } from './ping/ping.service';
import { HttpService } from './http/http.service';
import { CreateServiceDto } from './service.common-entity'
import { PrismaService } from '../database/prisma.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
    constructor(
        private readonly snmpService: SnmpService,
        private readonly webhookService: WebhookService,
        private readonly pingService: PingService,
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) {}

@Post()
@UseGuards(RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiOperation({ summary: 'Cadastrar novo serviço' })
@ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
create(
  @Body() createServiceDto: CreateServiceDto,
) {
  console.log("Creating service with type:", createServiceDto.type);
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

@Get(':id')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Serviço encontrado' })
@ApiResponse({ status: 404, description: 'Serviço não encontrado' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
@ApiOperation({ summary: 'Buscar serviço pelo ID' })
async findOne(@Param('id', ParseIntPipe) id: number) {
  console.log("Fetching service with ID:", id);

  const [ snmp, webhook, ping, http ] = await Promise.all([
    this.snmpService.findOne(id),
    this.webhookService.findOne(id),
    this.pingService.findOne(id),
    this.httpService.findOne(id),
  ]);

  const service = snmp || webhook || ping || http;
  if (!service) {
    throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
  }
  return service;
}

@Get(':id/merged')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
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
@ApiOperation({ summary: 'Buscar serviço pelo ID com dados mesclados (Banco + CheckCle)' })
async findOneMerged(@Param('id', ParseIntPipe) id: number) {
  console.log("Fetching merged service data with ID:", id);

  // First, identify the service type
  const service = await this.prisma.service.findUnique({
    where: { id },
    select: { type: true },
  });

  if (!service) {
    throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
  }

  // Call the appropriate service's findOne method (which now includes merged data)
  switch (service.type) {
    case 'SNMP':
      return await this.snmpService.findOne(id);
    case 'WEBHOOK':
      return await this.webhookService.findOne(id);
    case 'PING':
      return await this.pingService.findOne(id);
    case 'HTTP':
      return await this.httpService.findOne(id);
    default:
      throw new BadRequestException(`Tipo de serviço não suportado: ${service.type}`);
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
  const services = [...snmp, ...webhook, ...ping, ...http];
  return { services };
}

@Get('merged')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
@ApiResponse({ 
  status: 200, 
  description: 'Lista de todos os serviços com dados mesclados (Banco + CheckCle)',
  schema: {
    example: {
      services: [
        {
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
      ]
    }
  }
})
@ApiOperation({ summary: 'Listar todos os serviços com dados mesclados (Banco + CheckCle)' })
async findAllMerged() {
  console.log("Fetching all services with merged data");

  // Each service type's findAll() method now returns merged data
  const [snmp, webhook, ping, http] = await Promise.all([
    this.snmpService.findAll(),
    this.webhookService.findAll(),
    this.pingService.findAll(),
    this.httpService.findAll(),
  ]);
  
  const services = [...snmp, ...webhook, ...ping, ...http];
  return { services };
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
async remove(@Param('id', ParseIntPipe) id: number) {
  // Primeiro identificar se existe e de qual tipo é
  const service = await this.prisma.service.findUnique({
    where: { id },
    select: { type: true }, // supondo que tenha um campo "type"
  });

  if (!service) {
    throw new NotFoundException('Serviço não encontrado');
  }

  // Agora deleta no service correto
  switch (service.type) {
    case 'SNMP':
      return await this.snmpService.remove(id);
    case 'WEBHOOK':
      return await this.webhookService.remove(id);
    case 'PING':
      return await this.pingService.remove(id);
    case 'HTTP':
      return await this.httpService.remove(id);
    default:
      throw new BadRequestException('Tipo de serviço inválido');
  }
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
