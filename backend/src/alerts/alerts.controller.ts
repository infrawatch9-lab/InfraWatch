import { Controller, Get, Post, Body, Param, ParseIntPipe, Sse, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse, 
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AlertService } from './alerts.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEventPattern, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Alerts - Sistema de Alertas')
@Controller('alerts')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('stream')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Stream de alertas em tempo real (SSE)',
    description: 'Conecta-se ao stream de Server-Sent Events para receber alertas em tempo real. Requer autenticação JWT.'
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
                id: { type: 'number', example: 123 },
                message: { type: 'string', example: 'Alerta de sistema' },
                serviceId: { type: 'number', example: 1 },
                ruleId: { type: 'number', example: 1 },
                triggeredAt: { type: 'string', format: 'date-time' }
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
  streamAlerts(): Observable<{ data: any }> {
    console.log('SSE connection established for alerts');
    return fromEventPattern(
      (handler) => {
        console.log('Registrando listener para alert.new');
        this.eventEmitter.on('alert.new', handler);
      },
      (handler) => {
        console.log('Removendo listener para alert.new');
        this.eventEmitter.off('alert.new', handler);
      },
    ).pipe(
      map((alert) => {
        console.log('Evento recebido no SSE:', alert);
        return { data: alert };
      }),
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Listar todos os alertas',
    description: 'Retorna uma lista de todos os alertas do sistema, ordenados por data de ativação (mais recente primeiro).'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alertas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'serviceId', 'ruleId', 'message', 'triggeredAt', 'resolved'],
        properties: {
          id: { 
            type: 'number', 
            description: 'ID único do alerta',
            example: 1 
          },
          serviceId: { 
            type: 'number', 
            description: 'ID do serviço que gerou o alerta',
            example: 1 
          },
          ruleId: { 
            type: 'number', 
            description: 'ID da regra que foi violada',
            example: 1 
          },
          message: { 
            type: 'string', 
            description: 'Mensagem descritiva do alerta',
            example: 'Serviço indisponível há mais de 5 minutos' 
          },
          triggeredAt: { 
            type: 'string', 
            format: 'date-time', 
            description: 'Data e hora quando o alerta foi disparado',
            example: '2025-08-21T10:30:00Z' 
          },
          resolved: { 
            type: 'boolean', 
            description: 'Indica se o alerta foi resolvido',
            example: false 
          },
          resolvedAt: { 
            type: 'string', 
            format: 'date-time', 
            nullable: true,
            description: 'Data e hora quando o alerta foi resolvido (null se não resolvido)',
            example: null
          },
          service: {
            type: 'object',
            description: 'Dados do serviço relacionado ao alerta',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'API Gateway' },
              url: { type: 'string', example: 'https://api.example.com' }
            }
          },
          rule: {
            type: 'object',
            description: 'Dados da regra que gerou o alerta',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Verificação de disponibilidade' },
              condition: { type: 'string', example: 'response_time > 5000' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas ADMINs podem listar todos os alertas' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Token JWT Bearer',
    required: true,
    schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  })
  findAll() {
    return this.alertService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obter um alerta pelo ID',
    description: 'Retorna os detalhes de um alerta específico pelo seu ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do alerta',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Alerta encontrado com sucesso',
    schema: {
      type: 'object',
      required: ['id', 'serviceId', 'ruleId', 'message', 'triggeredAt', 'resolved'],
      properties: {
        id: { 
          type: 'number', 
          description: 'ID único do alerta',
          example: 1 
        },
        serviceId: { 
          type: 'number', 
          description: 'ID do serviço que gerou o alerta',
          example: 1 
        },
        ruleId: { 
          type: 'number', 
          description: 'ID da regra que foi violada',
          example: 1 
        },
        message: { 
          type: 'string', 
          description: 'Mensagem descritiva do alerta',
          example: 'Serviço indisponível há mais de 5 minutos' 
        },
        triggeredAt: { 
          type: 'string', 
          format: 'date-time', 
          description: 'Data e hora quando o alerta foi disparado',
          example: '2025-08-21T10:30:00Z' 
        },
        resolved: { 
          type: 'boolean', 
          description: 'Indica se o alerta foi resolvido',
          example: false 
        },
        resolvedAt: { 
          type: 'string', 
          format: 'date-time', 
          nullable: true,
          description: 'Data e hora quando o alerta foi resolvido (null se não resolvido)',
          example: null
        },
        service: {
          type: 'object',
          description: 'Dados do serviço relacionado ao alerta',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'API Gateway' },
            url: { type: 'string', example: 'https://api.example.com' }
          }
        },
        rule: {
          type: 'object',
          description: 'Dados da regra que gerou o alerta',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Verificação de disponibilidade' },
            condition: { type: 'string', example: 'response_time > 5000' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'ID inválido fornecido' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes' })
  @ApiResponse({ status: 404, description: 'Alerta não encontrado' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Token JWT Bearer',
    required: true,
    schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.findOne(id);
  }
}
