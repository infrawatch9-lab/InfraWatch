import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectionManager, ServiceConnection } from './connection-manager.service';

export interface MessagePayload {
  from: string;
  to: string;
  payload: any;
  timestamp?: string;
}

export interface BroadcastResult {
  success: boolean;
  totalSent: number;
  failedServices: string[];
}

export interface DirectMessageResult {
  success: boolean;
  delivered: boolean;
  targetFound: boolean;
  error?: string;
}

@Injectable()
export class MessageRouterService {
  constructor(private connectionManager: ConnectionManager) {}

  /**
   * Envia mensagem para um ou todos os microserviços
   */
  routeMessage(data: MessagePayload): BroadcastResult | DirectMessageResult {
    try {
      if (data.to === 'all') {
        return this.broadcastMessage(data);
      } else {
        return this.sendDirectMessage(data);
      }
    } catch (error) {
      console.error('❌ Erro ao rotear mensagem:', error);
      return {
        success: false,
        delivered: false,
        targetFound: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Broadcast para todos os serviços conectados
   */
  private broadcastMessage(data: MessagePayload, eventType: string = 'message'): BroadcastResult {
    const connections = this.connectionManager.getAllConnections();
    const serviceIds = Object.keys(connections);
    const failedServices: string[] = [];
    let successCount = 0;

    console.log(`📡 Fazendo broadcast de ${data.from} para ${serviceIds.length} microserviços`);

    for (const [serviceId, connection] of Object.entries(connections)) {
      try {
        connection.socket.emit(eventType, {
          from: data.from,
          to: serviceId,
          payload: data.payload,
          timestamp: data.timestamp || new Date().toISOString()
        });

        this.connectionManager.updateActivity(serviceId);
        successCount++;
        console.log(`✅ Broadcast entregue para "${serviceId}"`);
      } catch (error) {
        failedServices.push(serviceId);
        console.error(`❌ Falha ao enviar broadcast para "${serviceId}":`, error);
      }
    }

    const result = {
      success: failedServices.length === 0,
      totalSent: successCount,
      failedServices
    };

    console.log(`📊 Broadcast concluído: ${successCount}/${serviceIds.length} enviados com sucesso`);
    return result;
  }

  /**
   * Envia mensagem direta para um microserviço específico
   */
  private sendDirectMessage(data: MessagePayload, eventType: string = 'message'): DirectMessageResult {
    const connection = this.connectionManager.getConnection(data.to);

    if (!connection) {
      console.error(`❌ Micro-serviço "${data.to}" não encontrado`);
      return {
        success: false,
        delivered: false,
        targetFound: false,
        error: `Microserviço "${data.to}" não encontrado`
      };
    }

    try {
      console.log(`📨 Enviando mensagem de "${data.from}" para "${data.to}"`);
      
      connection.socket.emit(eventType, {
        from: data.from,
        to: data.to,
        payload: data.payload,
        timestamp: data.timestamp || new Date().toISOString()
      });

      this.connectionManager.updateActivity(data.to);
      console.log(`✅ Mensagem entregue para "${data.to}"`);

      return {
        success: true,
        delivered: true,
        targetFound: true
      };
    } catch (error) {
      console.error(`❌ Falha ao enviar mensagem para "${data.to}":`, error);
      return {
        success: false,
        delivered: false,
        targetFound: true,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia mensagem do gateway para microserviços
   */
  sendFromGateway(to: string, payload: any): BroadcastResult | DirectMessageResult {
    const messageData: MessagePayload = {
      from: 'gateway',
      to,
      payload,
      timestamp: new Date().toISOString()
    };

    if (to === 'all') {
      return this.broadcastMessage(messageData, 'gateway_message');
    } else {
      return this.sendDirectMessage(messageData, 'gateway_message');
    }
  }

  /**
   * Obtém estatísticas de roteamento
   */
  getRoutingStats() {
    const connectionStats = this.connectionManager.getConnectionStats();
    
    return {
      ...connectionStats,
      availableTargets: ['all', ...connectionStats.serviceIds],
      routingCapability: {
        broadcast: connectionStats.totalConnections > 0,
        directMessage: connectionStats.totalConnections > 0,
        gatewayMessages: true
      }
    };
  }
}
