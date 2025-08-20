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
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { SnmpService } from './snmp.service';
import {  SnmpDto as CreateServiceDto } from './snmp.entity';


@ApiTags('snmp')
@Controller('snmp')
export class SnmpController {
  constructor(private readonly snmpService: SnmpService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo serviço SNMP' })
  @ApiResponse({ status: 201, description: 'Serviço SNMP criado com sucesso' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.snmpService.create(createServiceDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lista de serviços SNMP' })
  @ApiResponse({ status: 404, description: 'Serviços SNMP não encontrados' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Listar todos os serviços SNMP' })
  findAll() {
    return this.snmpService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço SNMP encontrado'})
  @ApiResponse({ status: 404, description: 'Serviço SNMP não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Obter um serviço SNMP pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.snmpService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço SNMP atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço SNMP não encontrado' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar serviço SNMP' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Atualizar configuração de um serviço SNMP' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSnmpDto: CreateServiceDto) {
    return this.snmpService.update(id, updateSnmpDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço SNMP removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço SNMP não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiResponse({ status: 400, description: 'Erro ao remover serviço SNMP' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiOperation({ summary: 'Remover serviço SNMP pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.snmpService.remove(id);
  }

  @Delete()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço SNMP removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço SNMP não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiResponse({ status: 400, description: 'Erro ao remover serviço SNMP' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiOperation({ summary: 'Remover todos os serviços SNMP' })
  removeAll() {
    return this.snmpService.removeAll();
  }
}
