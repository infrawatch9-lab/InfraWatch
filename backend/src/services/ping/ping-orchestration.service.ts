import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePingServiceDto } from './ping.entity';
import { getDifferences } from './ping.utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PingDatabaseService } from './ping-database.service';
import { PingCheckcleService } from './ping-checkcle.service';

@Injectable()
export class PingOrchestrationService {
  private readonly logger = new Logger(PingOrchestrationService.name);

  constructor(
    private readonly pingDatabaseService: PingDatabaseService,
    private readonly pingCheckcleService: PingCheckcleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Orquestra a criação completa de um serviço ping
   */
  async createPingService(data: CreatePingServiceDto): Promise<any> {
    try {
      const teamId = data.teamId || 1;
      
      // 1. Verificar se o serviço já existe
      const serviceExists = await this.pingDatabaseService.checkServiceExists(data.name);
      if (serviceExists) {
        this.logger.warn(`Service with name ${data.name} already exists for team ID ${teamId}`);
        return { message: 'Service already exists' };
      }

      // 2. Criar o serviço no banco de dados
      const result = await this.pingDatabaseService.createPingServiceTransaction(data);

      if (!result.service) {
        this.logger.warn('Serviço não foi criado corretamente.');
        return { message: 'Serviço não foi criado corretamente.' };
      }

      this.logger.log(`Serviço de ping criado: ${result.service.name}`);
      
      // 3. Sincronizar com CheckCle
      await this.syncServiceWithCheckcle('create', result);

      return result;
    } catch (error) {
      this.logger.error('Erro ao criar serviço de ping:', error);
      throw error;
    }
  }

  /**
   * Busca todos os serviços com dados do CheckCle mergeados
   */
  async findAllServices(): Promise<any[]> {
    const services = await this.pingDatabaseService.findAllPingServices();

    // Apply merge for each service
    const mergedServices = await Promise.all(
      services.map(service => this.pingCheckcleService.mergeServiceWithCheckcleData(service))
    );

    return mergedServices;
  }

  /**
   * Busca um serviço específico com dados do CheckCle mergeados
   */
  async findOneService(id: number): Promise<any> {
    const service = await this.pingDatabaseService.findPingServiceById(id);
    
    // Merge database data with CheckCle monitoring data
    return await this.pingCheckcleService.mergeServiceWithCheckcleData(service);
  }

  /**
   * Orquestra a atualização de um serviço ping
   */
  async updateService(serviceId: number, data: CreatePingServiceDto): Promise<any> {
    const existingService = await this.pingDatabaseService.findPingServiceById(serviceId);

    const differences = getDifferences(existingService, data);
    
    console.log("Existente");
    console.table(`{existingService: ${JSON.stringify(existingService)}, data: ${JSON.stringify(data)}}`);
    
    console.log("Actualizacoes");
    console.table(`Differences: ${JSON.stringify(data)}`);
    
    if (differences.length === 0) {
      this.logger.log('Nenhuma diferença encontrada.');
      return existingService;
    }

    this.logger.log(`Diferenças encontradas: ${differences.join(', ')}`);

    // Atualizar no banco de dados
    const updatedService = await this.pingDatabaseService.updatePingService(serviceId, data);
    
    // Log apenas se pingConfig existir
    if (data.pingConfig?.interval) {
      console.log(`Serviço de ping atualizado: ${data.pingConfig.interval}`);
    } else {
      console.log(`Serviço de ping atualizado (sem alteração de configuração)`);
    }
    
    // Emitir evento de atualização
    this.eventEmitter.emit('dashboard.updated', {
      serviceId,
      data,
    });

    // Sincronizar com CheckCle apenas se houver checkcleId
    if (existingService.checkcleId) {
      // Usar configurações existentes se não foram fornecidas novas
      const configToUse = data.pingConfig || existingService.configs?.PingConfig || {};
      const monitoringConfigToUse = data.monitoringConfig || existingService.configs || {};
      
      await this.syncServiceWithCheckcle('update', {
        service: { 
          ...existingService, 
          name: data.name || existingService.name, 
          description: data.description || existingService.description,
          status: data.status || existingService.status
        },
        pingConfig: configToUse,
        monitoringConfig: {
          interval: configToUse.interval || monitoringConfigToUse.interval || 60,
          timeout: configToUse.timeout || monitoringConfigToUse.timeout || 5000
        }
      }, existingService.checkcleId);
    }
    
    return updatedService;
  }

  /**
   * Orquestra a remoção de um serviço ping
   */
  async removeService(id: number): Promise<any> {
    const service = await this.pingDatabaseService.deletePingService(id);

    // Sincronizar remoção com CheckCle
    await this.syncServiceWithCheckcle('delete', null, service.checkcleId);

    return { message: 'Serviço de ping removido com sucesso' };
  }

  /**
   * Remove todos os serviços ping
   */
  async removeAllServices(): Promise<any> {
    await this.pingDatabaseService.deleteAllPingServices();
    return { message: 'Todos os serviços de ping foram removidos com sucesso' };
  }

  /**
   * Controla o status de operação do serviço (pause/resume)
   */
  async controlServiceStatus(id: number, action: 'resume' | 'pause'): Promise<any> {
    const service = await this.pingDatabaseService.findPingServiceById(id);

    if (action === 'resume') {
      if (service.status === 'ACTIVE') {
        return { message: 'Serviço já está ativo' };
      }
      
      await this.pingDatabaseService.updateServiceStatus(id, 'ACTIVE');
      return { message: 'Serviço de ping retomado com sucesso' };
    } 
    else if (action === 'pause') {
      if (service.status === 'PAUSED') {
        return { message: 'Serviço já está parado' };
      }
      
      await this.pingDatabaseService.updateServiceStatus(id, 'PAUSED');
      return { message: 'Serviço de ping pausado com sucesso' };
    }
      
    return { message: 'Ação inválida' };
  }

  /**
   * Atualiza o status de saúde do serviço
   */
  async updateHealthStatus(id: number, status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING'): Promise<any> {
    const service = await this.pingDatabaseService.findPingServiceById(id);

    if (service.status === status) {
      return { message: `Serviço já está ${status === 'UP' ? 'ativo' : 'inativo'}` };
    }

    await this.pingDatabaseService.updateServiceHealthStatus(id, status);
    return { message: `Serviço de ping ${status === 'UP' ? 'ativado' : 'desativado'} com sucesso` };
  }

  /**
   * Busca o status atual de um serviço no CheckCle
   */
  async getCheckcleServiceStatus(serviceId: number): Promise<any> {
    try {
      const service = await this.pingDatabaseService.findPingServiceById(serviceId);

      if (!service.checkcleId) {
        throw new NotFoundException('Serviço não possui ID do CheckCle');
      }

      const checkcleData = await this.pingCheckcleService.getServiceStatus(service.checkcleId);
      
      return {
        serviceId: serviceId,
        serviceName: service.name,
        checkcleId: service.checkcleId,
        checkcleStatus: checkcleData.checkcleStatus,
        responseTime: checkcleData.responseTime,
        uptime: checkcleData.uptime,
        lastChecked: checkcleData.lastChecked,
        updated: checkcleData.updated
      };

    } catch (error) {
      this.logger.error(`Erro ao buscar status no CheckCle para serviço ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza o status de todos os serviços com o CheckCle
   */
  async syncAllServicesStatus(): Promise<any[]> {
    try {
      const services = await this.pingDatabaseService.findServicesWithCheckcleId();

      const statusUpdates = [];

      for (const service of services) {
        try {
          const checkcleStatus = await this.getCheckcleServiceStatus(service.id);
          statusUpdates.push(checkcleStatus);
        } catch (error) {
          this.logger.error(`Erro ao sincronizar status do serviço ${service.id}:`, error);
        }
      }

      return statusUpdates;

    } catch (error) {
      this.logger.error('Erro ao sincronizar status de todos os serviços:', error);
      throw error;
    }
  }

  /**
   * Método privado para sincronizar com CheckCle
   */
  private async syncServiceWithCheckcle(
    operation: 'create' | 'update' | 'delete', 
    data?: any, 
    checkcleId?: string
  ): Promise<void> {
    try {
      if (operation === 'create' && data) {
        const checkcleServiceData = this.pingCheckcleService.mapToCheckcleFormat(
          data.service, 
          data.pingConfig, 
          data.monitoringConfig
        );
        
        console.log("Passing CheckCle Data:");
        console.log("CheckCle Data:", JSON.stringify(checkcleServiceData, null, 2));
        console.log("Creating service in CheckCle with data");

        const checkcleResponse = await this.pingCheckcleService.syncWithCheckcle('create', checkcleServiceData);
        
        // Salvar o ID do CheckCle na BD local
        await this.pingDatabaseService.updateServiceCheckcleId(data.service.id, checkcleResponse.checkcleId);

        this.logger.log(`CheckCle ID ${checkcleResponse.checkcleId} salvo para o serviço ${data.service.id}`);

      } else if (operation === 'update' && data && checkcleId) {
        const checkcleServiceData = this.pingCheckcleService.mapToCheckcleFormat(
          data.service,
          data.pingConfig,
          data.monitoringConfig
        );

        await this.pingCheckcleService.syncWithCheckcle('update', checkcleServiceData, checkcleId);
        this.logger.log(`Serviço atualizado no CheckCle: ${checkcleId}`);

      } else if (operation === 'delete' && checkcleId) {
        await this.pingCheckcleService.syncWithCheckcle('delete', null, checkcleId);
        this.logger.log(`Serviço deletado no CheckCle: ${checkcleId}`);

      } else {
        this.logger.warn(`Operação ${operation} não pôde ser sincronizada com CheckCle - dados insuficientes`);
      }
      
    } catch (error) {
      this.logger.error(`Erro ao sincronizar com CheckCle durante ${operation}:`, error);
      // Continua sem falhar - operação local foi executada com sucesso
    }
  }
}
