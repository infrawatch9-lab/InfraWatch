import { Injectable, Logger } from '@nestjs/common';
import { CheckcleAuthService } from '../../auth/checkCle';
import { ServiceType } from '@prisma/client';

@Injectable()
export class PingCheckcleService {
  private readonly logger = new Logger(PingCheckcleService.name);

  constructor(
    private readonly checkcleAuthService: CheckcleAuthService,
  ) {}

  /**
   * Converte os dados do serviço local para o formato esperado pelo CheckCle
   */
  mapToCheckcleFormat(service: any, pingConfig: any, monitoringConfig: any): any {
    return {
      name: service.name + "_" + service.id + "_" + ServiceType.PING,
      url: `${pingConfig.ipAddress}`,
      service_type: "ping",
      heartbeat_interval: monitoringConfig.interval,
      max_retries: 3,
      status: this.mapLocalStatusToCheckcle(service.status), // Mapear o status real do serviço
      port: 0,
      region_name: "Luanda",
      notification_status: true,
      template_id: process.env.TEMPLATE_ID || "88ydacw6t6j34mi",
      notification_id: process.env.NOTIFICATION_ID || "5pq81fx31h9e3yg"
    };
  }

  /**
   * Mapeia o status do CheckCle para o formato local
   */
  private mapCheckcleStatusToLocal(checkcleStatus: string): string {
    switch (checkcleStatus?.toLowerCase()) {
      case 'up':
        return 'ACTIVE';
      case 'down':
      case 'failed':
        return 'INACTIVE';
      case 'paused':
        return 'PAUSED';
      case 'maintenance':
        return 'PAUSED'; // Mapear maintenance para PAUSED
      case 'unknown':
      case 'pending':
      default:
        return 'INACTIVE';
    }
  }

  /**
   * Mapeia o status local para o formato CheckCle
   */
  private mapLocalStatusToCheckcle(localStatus: string): string {
    switch (localStatus?.toUpperCase()) {
      case 'ACTIVE':
        return 'up';
      case 'INACTIVE':
        return 'down';
      case 'PAUSED':
        return 'paused';
      default:
        return 'down';
    }
  }

  /**
   * Sincroniza um serviço com o CheckCle (criar/atualizar/deletar)
   */
  async syncWithCheckcle(action: 'create' | 'update' | 'delete', serviceData?: any, checkcleId?: string): Promise<any> {
    try {
      switch (action) {
        case 'create':
          const createResponse = await this.checkcleAuthService.callCheckCle('/collections/services/records', 'POST', serviceData);
          this.logger.log(`Serviço criado no CheckCle com ID: ${createResponse.id}`);
          
          return {
            checkcleId: createResponse.id,
            status: createResponse.status,
            created: createResponse.created,
            updated: createResponse.updated
          };

        case 'update':
          if (!checkcleId) throw new Error('CheckCle ID é necessário para atualização');
          const updateResponse = await this.checkcleAuthService.callCheckCle(`/collections/services/records/${checkcleId}`, 'PATCH', serviceData);
          this.logger.log(`Serviço atualizado no CheckCle: ${checkcleId}`);
          
          return {
            checkcleId: updateResponse.id,
            status: updateResponse.status,
            updated: updateResponse.updated
          };

        case 'delete':
          if (!checkcleId) throw new Error('CheckCle ID é necessário para deleção');
          await this.checkcleAuthService.callCheckCle(`/collections/services/records/${checkcleId}`, 'DELETE');
          this.logger.log(`Serviço deletado no CheckCle: ${checkcleId}`);
          break;

        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao ${action} serviço no CheckCle:`, error);
      throw error;
    }
  }

  /**
   * Busca o status atual de um serviço no CheckCle
   */
  async getServiceStatus(checkcleId: string): Promise<any> {
    try {
      const checkcleService = await this.checkcleAuthService.callCheckCle(`/collections/services/records/${checkcleId}`);
      
      return {
        checkcleStatus: checkcleService.status,
        responseTime: checkcleService.response_time,
        uptime: checkcleService.uptime,
        lastChecked: checkcleService.last_checked,
        updated: checkcleService.updated
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar status no CheckCle:`, error);
      throw error;
    }
  }

  /**
   * Merge database service data with CheckCle real-time monitoring data
   */
  async mergeServiceWithCheckcleData(service: any): Promise<any> {
    try {
      // Base data from database (source of truth for service configuration)
      const baseService = {
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status, // Status inicial do banco
        description: service.description,
        targetSLA: service.targetSLA,
        team: service.Team ? {
          id: service.Team.id,
          name: service.Team.name
        } : null,
        usersToNotify: service.usersToNotify?.map((userNotif: any) => ({
          id: userNotif.User.id,
          name: userNotif.User.name,
          email: userNotif.User.email,
          role: userNotif.User.role
        })) || []
      };

      // Try to get real-time monitoring data from CheckCle
      let monitoringData = {
        status: baseService.status, // Usar status do banco como fallback
        lastChecked: null,
        responseTime: null,
        uptime: 0
      };

      if (service.checkcleId) {
        try {
          const checkcleData = await this.getServiceStatus(service.checkcleId);
          
          // Lógica inteligente para o status:
          // - Se o serviço está PAUSED localmente, manter esse status
          // - Caso contrário, usar o status do CheckCle
          let finalStatus = service.status;
          if (!['PAUSED'].includes(service.status.toUpperCase())) {
            finalStatus = this.mapCheckcleStatusToLocal(checkcleData.checkcleStatus);
          }
          
          monitoringData = {
            status: finalStatus,
            lastChecked: checkcleData.lastChecked || null,
            responseTime: checkcleData.responseTime || null,
            uptime: checkcleData.uptime || 0
          };
        } catch (error) {
          this.logger.warn(`Não foi possível obter dados do CheckCle para o serviço ${service.id}: ${(error as Error).message}`);
        }
      } else {
        this.logger.warn(`Serviço ${service.id} não possui CheckCle ID`);
      }

      return {
        ...baseService,
        ...monitoringData
      };

    } catch (error) {
      this.logger.error(`Erro ao fazer merge dos dados do serviço ${service.id}:`, error);
      // Fallback to database-only data
      return {
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status, // Usar status do banco como fallback
        description: service.description,
        targetSLA: service.targetSLA,
        team: service.Team ? {
          id: service.Team.id,
          name: service.Team.name
        } : null,
        usersToNotify: service.usersToNotify?.map((userNotif: any) => ({
          id: userNotif.User.id,
          name: userNotif.User.name,
          email: userNotif.User.email,
          role: userNotif.User.role
        })) || [],
        lastChecked: null,
        responseTime: null,
        uptime: 0
      };
    }
  }
}
