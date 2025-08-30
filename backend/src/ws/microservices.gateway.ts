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
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../database/prisma.service';

@WebSocketGateway({ namespace: '/', cors: true })
export class MicroservicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connections: Record<string, Socket> = {};
  private processedMessages: Map<string, number> = new Map(); // Cache para evitar duplicatas
  private readonly MESSAGE_CACHE_TTL = 10000; // 10 segundos

  constructor(private emailService: EmailService, private prisma: PrismaService) {
    // Limpar cache de mensagens processadas a cada 30 segundos
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of this.processedMessages.entries()) {
        if (now - timestamp > this.MESSAGE_CACHE_TTL) {
          this.processedMessages.delete(key);
        }
      }
    }, 30000);
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    try {
      
      for (const key in this.connections) {
        if (this.connections[key].id === client.id) {
          delete this.connections[key];
          console.log(`Micro-serviço desconectado: "${key}"`);
          break;
        }
      }

    } catch (error) {
      console.error('Erro ao processar desconexão:', error);
    }
  }

  @SubscribeMessage('register')
  register(@MessageBody() data: { id: string }, @ConnectedSocket() client: Socket) {
    try {
      // Validação dos dados de entrada
      if (!data || typeof data !== 'object' || !data.id) {
        console.error('Dados de registro inválidos:', data);
        client.emit('register_error', {
          success: false,
          message: 'Campo "id" é obrigatório para registro',
          code: 'INVALID_REGISTER_DATA'
        });
        return;
      }

      const serviceId = data.id.trim();

      if (!serviceId || serviceId === '') {
        console.error('ID de serviço vazio:', data.id);
        client.emit('register_error', {
          success: false,
          message: 'ID do microserviço não pode ser vazio',
          code: 'EMPTY_SERVICE_ID'
        });
        return;
      }

      // Verificar se já existe um serviço com esse ID
      if (this.connections[serviceId]) {
        console.warn(`Microserviço "${serviceId}" já estava registrado, sobrescrevendo conexão...`);
      }

      // Registrar o microserviço
      this.connections[serviceId] = client;
      const totalConnected = Object.keys(this.connections).length;
      console.log(`Micro-serviço registrado: "${serviceId}" (Total: ${totalConnected})`);
      console.log(`Microserviços conectados: [${Object.keys(this.connections).join(', ')}]`);

      // Confirmar registro bem-sucedido
      client.emit('register_success', {
        success: true,
        message: `Microserviço "${serviceId}" registrado com sucesso`,
        serviceId: serviceId,
        connectedServices: Object.keys(this.connections)
      });

    } catch (error) {
      console.error('Erro ao registrar microserviço:', error);
      client.emit('register_error', {
        success: false,
        message: 'Erro interno ao registrar microserviço',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  @SubscribeMessage('message')
  handleMessageRest(data: { from: string; to: string; payload: any }) {
    if (data.to === 'all') {
      for (const key in this.connections) {
        this.connections[key].emit('message', { from: data.from, payload: data.payload });
      }
    } else {
      const target = this.connections[data.to];
      if (target) {
        console.log(`Enviando mensagem de ${data.from} para ${data.to}`);
        target.emit('message', { from: data.from, payload: data.payload });
      }
      else
      {
        console.error(`Micro-serviço ${data.to} não encontrado`);
        throw new Error(`Micro-serviço ${data.to} não encontrado`);
      }
    }
  }

  @SubscribeMessage('list_services')
  listConnectedServices(@ConnectedSocket() client: Socket) {
    try {
      const connectedServices = Object.keys(this.connections);
      
      client.emit('services_list', {
        success: true,
        services: connectedServices,
        count: connectedServices.length,
        timestamp: new Date().toISOString()
      });

      console.log(`Enviada lista de ${connectedServices.length} microserviços conectados`);
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
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
        
        // Criar uma chave única para identificar mensagens duplicadas
        const messageKey = `${from}-${payload.serviceId}-${payload.status}-${payload.timestamp}`;
        
        // Verificar se já processamos esta mensagem recentemente
        if (this.processedMessages.has(messageKey)) {
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
        this.processedMessages.set(messageKey, Date.now());
        
        console.log(`📨 Mensagem recebida de "${from}" em ${timestamp}:`, payload);
        console.log(`🔑 Message Key: ${messageKey}`);
        
        // Atualizar status no banco
        this.setStatus({ id: payload.serviceId, status: payload.status });

        // Confirmar recebimento
        client.emit('message_received', {
          success: true,
          message: 'Mensagem recebida com sucesso pelo gateway',
          receivedAt: new Date().toISOString(),
          originalMessage: data,
          messageKey: messageKey
        });

        // Enviar email (apenas uma vez)
        console.log(`📧 Enviando alerta de email para: ${payload.recipients?.join(', ') || 'N/A'}`);
        this.emailService.sendAlert('ping', { payload, timestamp })
          .then(() => {
            console.log(`✅ Email enviado com sucesso para serviceId: ${payload.serviceId}`);
          })
          .catch((error) => {
            console.error(`❌ Erro ao enviar email para serviceId: ${payload.serviceId}:`, error);
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
    try {
      if (to === 'all') {
        // Broadcast para todos
        const connectedServices = Object.keys(this.connections);
        console.log(`🔄 Gateway enviando broadcast para ${connectedServices.length} microserviços`);
        
        for (const [serviceId, socket] of Object.entries(this.connections)) {
          socket.emit('gateway_message', {
            from: 'gateway',
            to: serviceId,
            payload: payload,
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`✅ Broadcast do gateway enviado para ${connectedServices.length} microserviços`);
        
      } else {
        // Envio direto
        const target = this.connections[to];
        if (target) {
          console.log(`📨 Gateway enviando mensagem para "${to}"`);
          target.emit('gateway_message', {
            from: 'gateway',
            to: to,
            payload: payload,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Mensagem do gateway entregue para "${to}"`);
          return true;
        } else {
          console.error(`❌ Gateway: Microserviço "${to}" não encontrado`);
          return false;
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem do gateway:', error);
      return false;
    }
  }

  async setStatus(params: { id: number; status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING' }) {
    try {
      const { id, status } = params;
      console.log(`🔄 Atualizando status do serviço ${id} para ${status}`);
      
      const updatedService = await this.prisma.service.update({
        where: { id },
        data: { status },
      });
      
      console.log(`✅ Status atualizado: Serviço ${id} agora está ${status}`);
      return updatedService;
    } catch (error) {
      console.error(`❌ Erro ao atualizar status do serviço ${params.id}:`, error);
      throw error;
    }
  }

  // Método para obter estatísticas do gateway
  @SubscribeMessage('gateway_stats')
  getGatewayStats(@ConnectedSocket() client: Socket) {
    try {
      const stats = {
        success: true,
        connectedServices: Object.keys(this.connections).length,
        services: Object.keys(this.connections),
        processedMessages: this.processedMessages.size,
        cacheEntries: Array.from(this.processedMessages.entries()).map(([key, timestamp]) => ({
          key,
          timestamp: new Date(timestamp).toISOString(),
          ageInSeconds: Math.floor((Date.now() - timestamp) / 1000)
        })),
        timestamp: new Date().toISOString()
      };
      
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
      const clearedCount = this.processedMessages.size;
      this.processedMessages.clear();
      
      client.emit('cache_cleared', {
        success: true,
        message: `Cache limpo com sucesso`,
        clearedEntries: clearedCount,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🧹 Cache de mensagens limpo: ${clearedCount} entradas removidas por ${client.id}`);
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
