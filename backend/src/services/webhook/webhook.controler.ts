import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { WebhookService } from './webhook.service';
import { WebhookDto } from './webhook.entity';
import { Response } from 'express';
import { Public } from '../../auth/public.decorator';


@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo serviço Webhook' })
  @ApiResponse({ status: 201, description: 'Serviço Webhook criado com sucesso' })
  create(@Body() createServiceDto: WebhookDto) {
    return this.webhookService.create(createServiceDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lista de serviços Webhook' })
  @ApiResponse({ status: 404, description: 'Serviços Webhook não encontrados' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Listar todos os serviços Webhook' })
  findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço Webhook encontrado'})
  @ApiResponse({ status: 404, description: 'Serviço Webhook não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Obter um serviço Webhook pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço Webhook atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço Webhook não encontrado' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar serviço Webhook' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiOperation({ summary: 'Atualizar configuração de um serviço Webhook' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateWebhookDto: WebhookDto) {
    return this.webhookService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço Webhook removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço Webhook não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiResponse({ status: 400, description: 'Erro ao remover serviço Webhook' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiOperation({ summary: 'Remover serviço Webhook pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.remove(id);
  }

  @Delete()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Serviço Webhook removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço Webhook não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiResponse({ status: 400, description: 'Erro ao remover serviço Webhook' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiOperation({ summary: 'Remover todos os serviços Webhook' })
  removeAll() {
    return this.webhookService.removeAll();
  }

  @Post(':id/:servico/:provedor')
  @Public()
  @ApiOperation({ summary: 'Receber dados do Webhook' })
  @ApiResponse({ status: 200, description: 'Dados do Webhook recebidos com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço Webhook não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @ApiResponse({ status: 400, description: 'Erro ao receber dados do Webhook' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  handleWebhook(
    @Param('id') id: string,
    @Param('servico') servico: string,
    @Param('provedor') provedor: string,
    @Body() data: any,
    @Res() res: Response
  ) {
    this.webhookService.handleWebhook(id, servico, provedor, data);
    return res.status(200).send({ message: 'Webhook recebido com sucesso' });
  }
}
