import { Injectable } from '@nestjs/common';
import { ConnectionManager } from './connection-manager.service';
import { MessageCacheService } from './message-cache.service';
import { AlertProcessorService } from './alert-processor.service';

export interface GatewayStats {
  success: boolean;
  timestamp: string;
  connections: {
    total: number;
    services: string[];
    details: any[];
  };
  messageCache: {
    totalEntries: number;
    ttlSeconds: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  };
  alerts: {
    totalAlerts: number;
    recentAlerts: number;
    activeServices: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
}

@Injectable()
export class GatewayAdminService {
  private startTime: Date;

  constructor(
    private connectionManager: ConnectionManager,
    private messageCacheService: MessageCacheService,
    private alertProcessor: AlertProcessorService
  ) {
    this.startTime = new Date();
  }

  /**
   * Obtém estatísticas completas do gateway
   */
  async getGatewayStats(): Promise<GatewayStats> {
    try {
      const [connectionStats, cacheStats, alertStats] = await Promise.all([
        this.connectionManager.getConnectionStats(),
        this.messageCacheService.getCacheStats(),
        this.alertProcessor.getAlertStats()
      ]);

      const systemStats = this.getSystemStats();

      return {
        success: true,
        timestamp: new Date().toISOString(),
        connections: {
          total: connectionStats.totalConnections,
          services: connectionStats.serviceIds,
          details: connectionStats.connections
        },
        messageCache: {
          totalEntries: cacheStats.totalEntries,
          ttlSeconds: cacheStats.ttlSeconds,
          oldestEntry: cacheStats.oldestEntry,
          newestEntry: cacheStats.newestEntry
        },
        alerts: {
          totalAlerts: alertStats.totalAlerts,
          recentAlerts: alertStats.recentAlerts,
          activeServices: alertStats.activeServices
        },
        system: systemStats
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do gateway:', error);
      throw error;
    }
  }

  /**
   * Limpa o cache de mensagens
   */
  clearMessageCache(): { success: boolean; clearedEntries: number; timestamp: string } {
    try {
      const clearedCount = this.messageCacheService.clearCache();
      
      return {
        success: true,
        clearedEntries: clearedCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      throw error;
    }
  }

  /**
   * Lista serviços conectados
   */
  getConnectedServices(): {
    success: boolean;
    services: string[];
    count: number;
    timestamp: string;
  } {
    try {
      const connectedServices = this.connectionManager.getConnectedServiceIds();
      
      return {
        success: true,
        services: connectedServices,
        count: connectedServices.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao listar serviços:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  private getSystemStats() {
    const uptimeMs = Date.now() - this.startTime.getTime();
    
    return {
      uptime: Math.floor(uptimeMs / 1000), // em segundos
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };
  }

  /**
   * Força desconexão de um serviço específico
   */
  forceDisconnectService(serviceId: string): {
    success: boolean;
    message: string;
    timestamp: string;
  } {
    try {
      const connection = this.connectionManager.getConnection(serviceId);
      
      if (!connection) {
        return {
          success: false,
          message: `Serviço "${serviceId}" não encontrado`,
          timestamp: new Date().toISOString()
        };
      }

      // Desconectar o socket
      connection.socket.disconnect(true);
      
      // Remover da lista de conexões
      this.connectionManager.unregisterService(serviceId);

      console.log(`🔌 Serviço "${serviceId}" desconectado forçadamente`);

      return {
        success: true,
        message: `Serviço "${serviceId}" desconectado com sucesso`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Erro ao desconectar serviço "${serviceId}":`, error);
      return {
        success: false,
        message: `Erro ao desconectar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtém informações detalhadas de um serviço específico
   */
  getServiceDetails(serviceId: string) {
    try {
      const connection = this.connectionManager.getConnection(serviceId);
      
      if (!connection) {
        return {
          success: false,
          message: `Serviço "${serviceId}" não encontrado`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        serviceId,
        connection: {
          socketId: connection.socket.id,
          registeredAt: connection.registeredAt.toISOString(),
          lastActivity: connection.lastActivity.toISOString(),
          minutesSinceActivity: Math.floor((Date.now() - connection.lastActivity.getTime()) / 60000),
          isConnected: connection.socket.connected
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Erro ao obter detalhes do serviço "${serviceId}":`, error);
      return {
        success: false,
        message: `Erro ao obter detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtém health check do gateway
   */
  getHealthCheck() {
    const stats = this.connectionManager.getConnectionStats();
    const cacheStats = this.messageCacheService.getCacheStats();
    const systemStats = this.getSystemStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: systemStats.uptime,
      checks: {
        connections: {
          status: stats.totalConnections >= 0 ? 'ok' : 'warning',
          count: stats.totalConnections
        },
        cache: {
          status: cacheStats.totalEntries < 1000 ? 'ok' : 'warning',
          entries: cacheStats.totalEntries
        },
        memory: {
          status: systemStats.memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'ok' : 'warning', // 100MB
          heapUsed: systemStats.memoryUsage.heapUsed
        }
      }
    };
  }
}
