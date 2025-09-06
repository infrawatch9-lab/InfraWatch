import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpDatabaseService } from './http-database.service';
import { HttpCheckcleService } from './http-checkcle.service';
import { HttpDto } from './http.entity';

@Injectable()
export class HttpOrchestrationService {
  private readonly logger = new Logger(HttpOrchestrationService.name);

  constructor(
    private readonly httpDatabaseService: HttpDatabaseService,
    private readonly httpCheckcleService: HttpCheckcleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createService(createServiceDto: HttpDto): Promise<any> {
    const teamId = createServiceDto.teamId || 1;
    this.logger.log(`Creating HTTP service for team ID: ${teamId}`);
    
    // Verificar se o serviço já existe
    await this.httpDatabaseService.validateServiceDoesNotExist(createServiceDto.name);

    // Criar serviço no banco de dados
    const result = await this.httpDatabaseService.createServiceWithConfigs(createServiceDto, teamId);

    // Sincronizar com CheckCle
    await this.syncServiceWithCheckcle(result);

    return result;
  }

  async updateService(serviceId: number, data: HttpDto): Promise<any> {
    // Verificar se serviço existe
    const existingService = await this.httpDatabaseService.findServiceById(serviceId);
    if (!existingService) {
      throw new Error('Serviço de HTTP não encontrado');
    }
    
    // Atualizar dados do serviço
    const updatedService = await this.httpDatabaseService.updateService(serviceId, data);
    
    // Emitir evento de atualização
    this.eventEmitter.emit('dashboard.updated', { serviceId, data });

    // Sincronizar com CheckCle
    await this.syncUpdatedServiceWithCheckcle(updatedService, serviceId);

    return updatedService;
  }

  async removeService(id: number): Promise<any> {
    const service = await this.httpDatabaseService.findServiceById(id);
    if (!service) {
      throw new Error('Serviço de HTTP não encontrado');
    }

    // Deletar do CheckCle primeiro
    await this.deleteServiceFromCheckcle(service, id);

    // Deletar do banco de dados
    await this.httpDatabaseService.deleteService(id);
    
    return { message: 'Serviço de HTTP removido com sucesso' };
  }

  async findAllServicesWithMonitoring(): Promise<any[]> {
    const services = await this.httpDatabaseService.findAllHttpServices();
    return await this.mergeServicesWithCheckcleData(services);
  }

  async findOneServiceWithMonitoring(id: number): Promise<any> {
    const service = await this.httpDatabaseService.findServiceByIdWithFullData(id);
    if (!service) {
      throw new Error('Serviço de HTTP não encontrado');
    }

    // Merge com dados do CheckCle se disponível
    try {
      return await this.httpCheckcleService.mergeServiceWithCheckcleData(service);
    } catch (error) {
      this.logger.error(`Erro ao fazer merge com dados do CheckCle para serviço ${id}:`, error);
      return service; // Retorna dados do banco se falhar o merge
    }
  }

  private async syncServiceWithCheckcle(result: any) {
    try {
      const checkcleData = this.httpCheckcleService.mapToCheckcleFormat(
        result.service,
        result.httpConfig,
        result.monitoringConfig
      );
      
      const checkcleResponse = await this.httpCheckcleService.syncWithCheckcle('create', checkcleData);
      
      // Atualizar o serviço com o CheckCle ID
      await this.httpDatabaseService.updateCheckcleId(result.service.id, checkcleResponse.checkcleId);
      
      this.logger.log(`Serviço HTTP ${result.service.id} sincronizado com CheckCle: ${checkcleResponse.checkcleId}`);
      
      // Adicionar o checkcleId ao resultado
      result.service.checkcleId = checkcleResponse.checkcleId;
    } catch (checkcleError) {
      this.logger.error(`Erro ao sincronizar com CheckCle para serviço ${result.service.id}:`, checkcleError);
      // Não falhar a criação do serviço se a sincronização com CheckCle falhar
    }
  }

  private async syncUpdatedServiceWithCheckcle(updatedService: any, serviceId: number) {
    try {
      if (updatedService?.checkcleId) {
        const httpConfig = updatedService.configs?.HttpConfig;
        const monitoringConfig = updatedService.configs;
        
        if (httpConfig && monitoringConfig) {
          const checkcleData = this.httpCheckcleService.mapToCheckcleFormat(
            updatedService,
            httpConfig,
            monitoringConfig
          );
          
          await this.httpCheckcleService.syncWithCheckcle('update', checkcleData, updatedService.checkcleId);
          this.logger.log(`Serviço HTTP ${serviceId} atualizado no CheckCle`);
        }
      } else {
        this.logger.warn(`Serviço HTTP ${serviceId} não possui CheckCle ID para atualização`);
      }
    } catch (checkcleError) {
      this.logger.error(`Erro ao atualizar serviço no CheckCle para ${serviceId}:`, checkcleError);
    }
  }

  private async deleteServiceFromCheckcle(service: any, id: number) {
    if (service.checkcleId) {
      try {
        await this.httpCheckcleService.syncWithCheckcle('delete', undefined, service.checkcleId);
        this.logger.log(`Serviço HTTP ${id} deletado do CheckCle`);
      } catch (checkcleError) {
        this.logger.error(`Erro ao deletar serviço do CheckCle para ${id}:`, checkcleError);
        // Continuar com a deleção local mesmo se falhar no CheckCle
      }
    }
  }

  private async mergeServicesWithCheckcleData(services: any[]): Promise<any[]> {
    return await Promise.all(
      services.map(async (service) => {
        try {
          return await this.httpCheckcleService.mergeServiceWithCheckcleData(service);
        } catch (error) {
          this.logger.error(`Erro ao fazer merge com CheckCle para serviço ${service.id}:`, error);
          return this.createFallbackServiceData(service);
        }
      })
    );
  }

  private createFallbackServiceData(service: any) {
    return {
      id: service.id,
      name: service.name,
      type: service.type,
      description: service.description,
      status: service.status,
      teamId: service.teamId,
      createdAt: service.createdAt,
      lastChecked: null,
      responseTime: null,
      uptime: 0
    };
  }
}
