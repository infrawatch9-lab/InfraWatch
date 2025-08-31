import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionManager } from './connection-manager.service';
import { MessageCacheService } from './message-cache.service';
import { MessageRouterService } from './message-router.service';
import { AlertProcessorService } from './alert-processor.service';
import { GatewayAdminService } from './gateway-admin.service';

@WebSocketGateway({ namespace: '/', cors: true })
export class MicroservicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private connectionManager: ConnectionManager,
    private messageCacheService: MessageCacheService,
    private messageRouter: MessageRouterService,
    private alertProcessor: AlertProcessorService,
    private gatewayAdmin: GatewayAdminService
  ) {}

  handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    try {
      const disconnectedService = this.connectionManager.unregisterBySocket(client.id);
      if (disconnectedService) {
        console.log(`❌ Micro-serviço desconectado: "${disconnectedService}"`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar desconexão:', error);
    }
  }

  @SubscribeMessage('register')
  register(@MessageBody() data: { id: string }, @ConnectedSocket() client: Socket) {
    try {
      // Validação dos dados de entrada
      if (!data || typeof data !== 'object' || !data.id) {
        console.error('❌ Dados de registro inválidos:', data);
        client.emit('register_error', {
          success: false,
          message: 'Campo "id" é obrigatório para registro',
          code: 'INVALID_REGISTER_DATA'
        });
        return;
      }

      const serviceId = data.id.trim();

      if (!serviceId || serviceId === '') {
        console.error('❌ ID de serviço vazio:', data.id);
        client.emit('register_error', {
          success: false,
          message: 'ID do microserviço não pode ser vazio',
          code: 'EMPTY_SERVICE_ID'
        });
        return;
      }

      // Registrar o microserviço usando o ConnectionManager
      const success = this.connectionManager.registerService(serviceId, client);
      
      if (success) {
        const connectedServices = this.connectionManager.getConnectedServiceIds();
        
        client.emit('register_success', {
          success: true,
          message: `Microserviço "${serviceId}" registrado com sucesso`,
          serviceId: serviceId,
          connectedServices
        });
      } else {
        client.emit('register_error', {
          success: false,
          message: 'Falha ao registrar microserviço',
          code: 'REGISTRATION_FAILED'
        });
      }

    } catch (error) {
      console.error('❌ Erro ao registrar microserviço:', error);
      client.emit('register_error', {
        success: false,
        message: 'Erro interno ao registrar microserviço',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  @SubscribeMessage('message')
  handleMessageRest(data: { from: string; to: string; payload: any }) {
    try {
      const result = this.messageRouter.routeMessage(data);
      
      if (!result.success) {
        console.error(`❌ Falha ao rotear mensagem de ${data.from} para ${data.to}`);
        if ('error' in result && result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error(`❌ Erro no roteamento de mensagem:`, error);
      throw error;
    }
  }

  @SubscribeMessage('list_services')
  listConnectedServices(@ConnectedSocket() client: Socket) {
    try {
      const servicesList = this.gatewayAdmin.getConnectedServices();
      client.emit('services_list', servicesList);
      console.log(`📋 Lista de ${servicesList.count} microserviços enviada`);
    } catch (error) {
      console.error('❌ Erro ao listar serviços:', error);
      client.emit('error', {
        success: false,
        message: 'Erro ao obter lista de microserviços',
        code: 'LIST_SERVICES_ERROR'
      });
    }
  }

  @SubscribeMessage('receive_message')
  receiveMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    try {
      console.log(`📥 Remetente: ${client.id}`);
      
      if (data && typeof data === 'object') {
        const { from, payload, timestamp } = data;
        
        // Criar chave única para verificar duplicatas
        const messageKey = this.messageCacheService.generateMessageKey(
          from, 
          payload.serviceId, 
          payload.status, 
          payload.timestamp
        );
        
        // Verificar se já processamos esta mensagem
        if (this.messageCacheService.isMessageProcessed(messageKey)) {
          console.log(`⚠️  Mensagem duplicada detectada e ignorada: ${messageKey}`);
          client.emit('message_received', {
            success: true,
            message: 'Mensagem duplicada - ignorada',
            receivedAt: new Date().toISOString(),
            duplicate: true
          });
          return;
        }
        
        // Marcar mensagem como processada
        this.messageCacheService.markMessageAsProcessed(messageKey, data);
        
        console.log(`📨 Mensagem recebida de "${from}" em ${timestamp}:`, payload);
        console.log(`🔑 Message Key: ${messageKey}`);
        
        // Processar alerta usando o AlertProcessor
        const alertData = {
          serviceId: parseInt(payload.serviceId.toString()),
          status: payload.status,
          message: payload.message,
          timestamp: timestamp || new Date().toISOString(),
          recipients: payload.recipients
        };
        
        this.alertProcessor.processServiceAlert(alertData)
          .then(() => {
            console.log(`✅ Alerta processado com sucesso para serviceId: ${payload.serviceId}`);
          })
          .catch((error: any) => {
            console.error(`❌ Erro ao processar alerta para serviceId: ${payload.serviceId}:`, error);
          });

        // Confirmar recebimento
        client.emit('message_received', {
          success: true,
          message: 'Mensagem recebida com sucesso pelo gateway',
          receivedAt: new Date().toISOString(),
          originalMessage: data,
          messageKey: messageKey
        });

      } else {
        console.log(`⚠️  Formato de mensagem inválido recebido`);
        client.emit('error', {
          success: false,
          message: 'Formato de mensagem inválido',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
      client.emit('error', {
        success: false,
        message: 'Erro ao processar mensagem recebida',
        code: 'RECEIVE_MESSAGE_ERROR'
      });
    }
  }

  // Método para enviar mensagem do gateway para microserviços específicos
  sendFromGateway(to: string, payload: any) {
    return this.messageRouter.sendFromGateway(to, payload);
  }

  // Método para obter estatísticas do gateway
  @SubscribeMessage('gateway_stats')
  async getGatewayStats(@ConnectedSocket() client: Socket) {
    try {
      const stats = await this.gatewayAdmin.getGatewayStats();
      client.emit('gateway_stats_response', stats);
      console.log(`📊 Estatísticas do gateway enviadas para ${client.id}`);
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      client.emit('error', {
        success: false,
        message: 'Erro ao obter estatísticas do gateway',
        code: 'GATEWAY_STATS_ERROR'
      });
    }
  }

  // Método para limpar cache de mensagens processadas
  @SubscribeMessage('clear_message_cache')
  clearMessageCache(@ConnectedSocket() client: Socket) {
    try {
      const result = this.gatewayAdmin.clearMessageCache();
      client.emit('cache_cleared', result);
      console.log(`🧹 Cache de mensagens limpo: ${result.clearedEntries} entradas removidas por ${client.id}`);
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      client.emit('error', {
        success: false,
        message: 'Erro ao limpar cache',
        code: 'CLEAR_CACHE_ERROR'
      });
    }
  }
}
