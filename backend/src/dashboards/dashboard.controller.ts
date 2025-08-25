import { Controller, Post, Sse, UseGuards, Body, Param, Get } from '@nestjs/common';
import { fromEventPattern, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse, 
  ApiParam,
  ApiHeader 
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Dashboard - Sistema de Dashboards')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dashboardService: DashboardService,
  ) {}

@Sse('dash/stream')
// @UseGuards(RolesGuard)
// @Roles('ADMIN', 'USER')
// @ApiBearerAuth()
@Public()
@ApiOperation({ 
  summary: 'Stream de dashboards em tempo real (SSE)',
  description: 'Conecta-se ao stream de Server-Sent Events para receber atualizações de dashboards em tempo real. Requer autenticação JWT.'
})
@ApiResponse({
  status: 200,
  description: 'Conexão SSE estabelecida com sucesso',
  content: {
    'text/event-stream': {
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Dashboard Principal' },
              description: { type: 'string', example: 'Dashboard de monitoramento geral' },
              widgets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    type: { type: 'string', example: 'chart' },
                    title: { type: 'string', example: 'Status dos Serviços' },
                    data: { type: 'object' }
                  }
                }
              },
              lastUpdated: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }
})
@ApiResponse({ status: 401, description: 'Token JWT inválido ou ausente' })
@ApiResponse({ status: 403, description: 'Permissões insuficientes' })
@ApiHeader({
  name: 'Authorization',
  description: 'Token JWT Bearer',
  required: true,
  schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
})
streamDashboards(): Observable<{ data: any }> {
  return fromEventPattern(
    (handler) => this.eventEmitter.on('dashboard.updated', handler),
    (handler) => this.eventEmitter.off('dashboard.updated', handler),
  ).pipe(
    map((updatedDashboard) => ({ data: updatedDashboard })),
  );
}

@Get('/:id')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
@ApiOperation({ 
  summary: 'Obter um dashboard pelo ID',
  description: 'Retorna os detalhes de um dashboard específico pelo seu ID, incluindo todos os widgets configurados.'
})
@ApiParam({
  name: 'id',
  description: 'ID único do dashboard',
  type: 'number',
  example: 1
})
@ApiResponse({
  status: 200,
  description: 'Dashboard encontrado com sucesso',
  schema: {
    type: 'object',
    required: ['id', 'name', 'description', 'widgets', 'createdAt', 'updatedAt'],
    properties: {
      id: { 
        type: 'number', 
        description: 'ID único do dashboard',
        example: 1 
      },
      name: { 
        type: 'string', 
        description: 'Nome do dashboard',
        example: 'Dashboard Principal' 
      },
      description: { 
        type: 'string', 
        description: 'Descrição do dashboard',
        example: 'Dashboard de monitoramento geral do sistema' 
      },
      widgets: {
        type: 'array',
        description: 'Lista de widgets configurados no dashboard',
        items: {
          type: 'object',
          properties: {
            id: { 
              type: 'number', 
              description: 'ID único do widget',
              example: 1 
            },
            type: { 
              type: 'string', 
              description: 'Tipo do widget',
              enum: ['chart', 'metric', 'table', 'gauge'],
              example: 'chart' 
            },
            title: { 
              type: 'string', 
              description: 'Título do widget',
              example: 'Status dos Serviços' 
            },
            position: {
              type: 'object',
              description: 'Posição do widget no dashboard',
              properties: {
                x: { type: 'number', example: 0 },
                y: { type: 'number', example: 0 },
                width: { type: 'number', example: 6 },
                height: { type: 'number', example: 4 }
              }
            },
            data: { 
              type: 'object', 
              description: 'Dados e configurações específicas do widget'
            },
            refreshInterval: { 
              type: 'number', 
              description: 'Intervalo de atualização em segundos',
              example: 30 
            }
          }
        }
      },
      layout: {
        type: 'object',
        description: 'Configurações de layout do dashboard',
        properties: {
          columns: { type: 'number', example: 12 },
          rowHeight: { type: 'number', example: 150 }
        }
      },
      createdAt: { 
        type: 'string', 
        format: 'date-time', 
        description: 'Data de criação do dashboard',
        example: '2025-08-21T10:30:00Z' 
      },
      updatedAt: { 
        type: 'string', 
        format: 'date-time', 
        description: 'Data da última atualização',
        example: '2025-08-21T15:45:00Z' 
      }
    }
  }
})
@ApiResponse({ status: 400, description: 'ID inválido fornecido' })
@ApiResponse({ status: 401, description: 'Token JWT inválido ou ausente' })
@ApiResponse({ status: 403, description: 'Permissões insuficientes' })
@ApiResponse({ status: 404, description: 'Dashboard não encontrado' })
@ApiHeader({
  name: 'Authorization',
  description: 'Token JWT Bearer',
  required: true,
  schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
})
getDashboard(@Param('id') id: number) {
  return this.dashboardService.findOne(id);
}

@Sse('dash/test-sse')
@Public()
@ApiOperation({
  summary: 'Teste de SSE',
  description: 'Rota para testar envio de eventos SSE retornando um JSON fixo.'
})
@ApiResponse({ status: 200, description: 'Conexão SSE de teste estabelecida.' })
testSse(): Observable<{ data: any }> {

    const data = {
      cpuData: { label: "Intel Xeon", usage: 67 },
      ram: { label: "DDR4 32GB", usage: 12, total: 32 },
      disk: { usage: 120, unit: "GB", free: 40, inUse: 60 },
    }
  return data;
}

}
