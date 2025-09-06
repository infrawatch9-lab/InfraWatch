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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpService } from './http.service';
import { HttpCheckcleService } from './http-checkcle.service';
import {
  HttpDto,
} from './http.entity';

@ApiTags('http')
@Controller('http')
export class HttpController {
  private readonly logger = new Logger(HttpController.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly httpCheckcleService: HttpCheckcleService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo serviço HTTP' })
  @ApiResponse({ status: 201, description: 'Serviço HTTP criado com sucesso' })
  create(@Body() createHttpDto: HttpDto) {
    return this.httpService.create(createHttpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços HTTP' })
  findAll() {
    return this.httpService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um serviço HTTP pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.httpService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar configuração de um serviço HTTP' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHttpDto: HttpDto,
  ) {
    return this.httpService.update(id, updateHttpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover serviço HTTP pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.httpService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Remover todos os serviços HTTP' })
  removeAll() {
    return this.httpService.removeAll();
  }

  @Get(':id/checkcle-status')
  @ApiOperation({ summary: 'Obter status em tempo real do CheckCle para um serviço HTTP' })
  @ApiResponse({ status: 200, description: 'Status do CheckCle obtido com sucesso' })
  async getCheckcleStatus(@Param('id', ParseIntPipe) id: number) {
    try {
      const service = await this.httpService.findOne(id);
      
      if (!service.checkcleId) {
        return {
          message: 'Serviço não está sincronizado com CheckCle',
          checkcleId: null,
          status: 'not_monitored',
          synced: false
        };
      }

      const status = await this.httpCheckcleService.getServiceStatus(service.checkcleId);
      return {
        serviceId: id,
        checkcleId: service.checkcleId,
        ...status,
        synced: true
      };
    } catch (error) {
      this.logger.error(`Erro ao obter status do CheckCle para serviço ${id}:`, error);
      return {
        error: 'Erro ao obter status do CheckCle',
        details: error instanceof Error ? error.message : String(error),
        synced: false
      };
    }
  }

  @Post(':id/sync-checkcle')
  @ApiOperation({ summary: 'Forçar sincronização de um serviço HTTP com CheckCle' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  async syncWithCheckcle(@Param('id', ParseIntPipe) id: number) {
    try {
      const service = await this.httpService.findOne(id);
      const httpConfig = service.configs?.HttpConfig;
      const monitoringConfig = service.configs;
      
      if (!httpConfig || !monitoringConfig) {
        return { 
          error: 'Configurações do serviço HTTP não encontradas',
          synced: false 
        };
      }
      
      const checkcleData = this.httpCheckcleService.mapToCheckcleFormat(
        service,
        httpConfig,
        monitoringConfig
      );
      
      let result;
      if (service.checkcleId) {
        // Atualizar existente
        result = await this.httpCheckcleService.syncWithCheckcle('update', checkcleData, service.checkcleId);
      } else {
        // Criar novo
        result = await this.httpCheckcleService.syncWithCheckcle('create', checkcleData);
      }
      
      return {
        message: 'Sincronização com CheckCle realizada com sucesso',
        serviceId: id,
        checkcleId: result.checkcleId || service.checkcleId,
        synced: true
      };
    } catch (error) {
      this.logger.error(`Erro ao sincronizar serviço ${id} com CheckCle:`, error);
      return {
        error: 'Erro ao sincronizar com CheckCle',
        details: error instanceof Error ? error.message : String(error),
        synced: false
      };
    }
  }
}
