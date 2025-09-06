import { Injectable } from '@nestjs/common';
import { CheckcleAuthService } from './checkcle-auth.service';

@Injectable()
export class ExampleCheckCleService {
  constructor(private readonly checkcleAuthService: CheckcleAuthService) {}

  // Exemplo: Buscar todos os serviços
  async getServices() {
    return await this.checkcleAuthService.callCheckCle('/collections/services/records');
  }

  // Exemplo: Buscar todos os alertas
  async getAlerts() {
    return await this.checkcleAuthService.callCheckCle('/collections/alerts/records');
  }

  // Exemplo: Criar um novo serviço
  async createService(serviceData: any) {
    return await this.checkcleAuthService.callCheckCle('/collections/services/records', 'POST', serviceData);
  }

  // Exemplo: Buscar um serviço específico
  async getServiceById(id: string) {
    return await this.checkcleAuthService.callCheckCle(`/collections/services/records/${id}`);
  }

  // Exemplo: Atualizar um serviço
  async updateService(id: string, serviceData: any) {
    return await this.checkcleAuthService.callCheckCle(`/collections/services/records/${id}`, 'PUT', serviceData);
  }

  // Exemplo: Buscar com parâmetros de query
  async getServicesWithFilter(filter: string) {
    return await this.checkcleAuthService.callCheckCle(`/collections/services/records?filter=${encodeURIComponent(filter)}`);
  }
}
