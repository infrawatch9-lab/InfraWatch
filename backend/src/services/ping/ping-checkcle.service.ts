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
      status: service.status.toLowerCase() === 'active' ? 'up' : 'down',
      port: 0,
      region_name: "Luanda",
      notification_status: true,
      template_id: process.env.TEMPLATE_ID || "88ydacw6t6j34mi",
      notification_id: process.env.NOTIFICATION_ID || "5pq81fx31h9e3yg"
    };
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
        status: service.status,
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
        lastChecked: null,
        responseTime: null,
        uptime: 0
      };

      if (service.checkcleId) {
        try {
          const checkcleData = await this.getServiceStatus(service.checkcleId);
          monitoringData = {
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
        status: service.status,
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
