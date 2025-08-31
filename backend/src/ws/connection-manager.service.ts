import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

export interface ServiceConnection {
  socket: Socket;
  registeredAt: Date;
  lastActivity: Date;
}

@Injectable()
export class ConnectionManager {
  private connections: Record<string, ServiceConnection> = {};
  private readonly ACTIVITY_TIMEOUT = 300000; // 5 minutos

  constructor() {
    // Verificar conexões inativas a cada 2 minutos
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 120000);
  }

  /**
   * Registra um novo microserviço
   */
  registerService(serviceId: string, socket: Socket): boolean {
    try {
      if (this.connections[serviceId]) {
        console.warn(`🔄 Microserviço "${serviceId}" já estava registrado, sobrescrevendo conexão...`);
      }

      this.connections[serviceId] = {
        socket,
        registeredAt: new Date(),
        lastActivity: new Date()
      };

      const totalConnected = Object.keys(this.connections).length;
      console.log(`✅ Micro-serviço registrado: "${serviceId}" (Total: ${totalConnected})`);
      console.log(`📋 Microserviços conectados: [${Object.keys(this.connections).join(', ')}]`);

      return true;
    } catch (error) {
      console.error(`❌ Erro ao registrar microserviço "${serviceId}":`, error);
      return false;
    }
  }

  /**
   * Remove um microserviço pelo socket
   */
  unregisterBySocket(socketId: string): string | null {
    try {
      for (const [serviceId, connection] of Object.entries(this.connections)) {
        if (connection.socket.id === socketId) {
          delete this.connections[serviceId];
          console.log(`❌ Micro-serviço desconectado: "${serviceId}"`);
          return serviceId;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao processar desconexão:', error);
      return null;
    }
  }

  /**
   * Remove um microserviço pelo ID
   */
  unregisterService(serviceId: string): boolean {
    try {
      if (this.connections[serviceId]) {
        delete this.connections[serviceId];
        console.log(`❌ Micro-serviço removido: "${serviceId}"`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao remover microserviço "${serviceId}":`, error);
      return false;
    }
  }

  /**
   * Obtém uma conexão específica
   */
  getConnection(serviceId: string): ServiceConnection | null {
    return this.connections[serviceId] || null;
  }

  /**
   * Obtém todas as conexões ativas
   */
  getAllConnections(): Record<string, ServiceConnection> {
    return { ...this.connections };
  }

  /**
   * Lista IDs dos serviços conectados
   */
  getConnectedServiceIds(): string[] {
    return Object.keys(this.connections);
  }

  /**
   * Conta total de conexões
   */
  getTotalConnections(): number {
    return Object.keys(this.connections).length;
  }

  /**
   * Verifica se um serviço está conectado
   */
  isServiceConnected(serviceId: string): boolean {
    return serviceId in this.connections;
  }

  /**
   * Atualiza a última atividade de um serviço
   */
  updateActivity(serviceId: string): void {
    if (this.connections[serviceId]) {
      this.connections[serviceId].lastActivity = new Date();
    }
  }

  /**
   * Remove conexões inativas
   */
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveServices: string[] = [];

    for (const [serviceId, connection] of Object.entries(this.connections)) {
      const timeSinceActivity = now - connection.lastActivity.getTime();
      
      if (timeSinceActivity > this.ACTIVITY_TIMEOUT) {
        inactiveServices.push(serviceId);
      }
    }

    inactiveServices.forEach(serviceId => {
      console.log(`🧹 Removendo conexão inativa: "${serviceId}"`);
      this.unregisterService(serviceId);
    });

    if (inactiveServices.length > 0) {
      console.log(`🧹 Limpeza concluída: ${inactiveServices.length} conexões inativas removidas`);
    }
  }

  /**
   * Obtém estatísticas das conexões
   */
  getConnectionStats() {
    const connections = Object.entries(this.connections);
    const now = Date.now();

    return {
      totalConnections: connections.length,
      serviceIds: connections.map(([id]) => id),
      connections: connections.map(([serviceId, connection]) => ({
        serviceId,
        registeredAt: connection.registeredAt.toISOString(),
        lastActivity: connection.lastActivity.toISOString(),
        minutesSinceActivity: Math.floor((now - connection.lastActivity.getTime()) / 60000),
        isActive: (now - connection.lastActivity.getTime()) < this.ACTIVITY_TIMEOUT
      }))
    };
  }
}
