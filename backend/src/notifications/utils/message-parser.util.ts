/**
 * Utilitário para parsing de mensagens de webhook do CheckCle
 */

export interface ParsedServiceData {
  serviceName?: string;
  serviceId?: number;
  serviceType?: string;
  status?: string;
  responseTime?: number;
  incidentType?: string;
  timestamp?: string;
}

export class MessageParserUtil {
  /**
   * Extrai dados do serviço a partir da mensagem de webhook
   */
  static extractServiceData(message: string): ParsedServiceData {
    const result: ParsedServiceData = {};
    
    console.log('🔍 Analisando mensagem:', message);
    
    // Primeiro: tentar formato tokenizado
    const tokenizedData = this.parseTokenizedFormat(message);
    if (tokenizedData.serviceId) {
      return tokenizedData;
    }
    
    // Fallback: formatos legados
    return this.parseLegacyFormats(message);
  }

  /**
   * Parse do novo formato tokenizado: 'INFO|API Gateway Service_20_HTTP|UP|HTTP|248ms|2025-09-07 17:02:50'
   */
  private static parseTokenizedFormat(message: string): ParsedServiceData {
    if (!message.includes('|')) {
      return {};
    }

    const tokens = message.split('|');
    if (tokens.length < 6) {
      console.log('⚠️ Formato tokenizado incompleto, tokens encontrados:', tokens.length);
      return {};
    }

    const result: ParsedServiceData = {};

    // Token 0: Tipo de incidente (INFO, ALERT, WARNING, etc.)
    result.incidentType = tokens[0].trim().toUpperCase();
    
    // Token 1: Nome_ID_Tipo do serviço (ex: "API Gateway Service_20_HTTP")
    const serviceToken = tokens[1].trim();
    const serviceMatch = serviceToken.match(/^(.+)_(\d+)_(\w+)$/);
    if (serviceMatch) {
      result.serviceName = serviceMatch[1].trim();
      result.serviceId = parseInt(serviceMatch[2]);
      result.serviceType = serviceMatch[3].toUpperCase();
      console.log('✅ Service data extraído do token:', result);
    } else {
      console.log('⚠️ Formato do service token não reconhecido:', serviceToken);
      return {};
    }
    
    // Token 2: Status (UP, DOWN, etc.)
    result.status = tokens[2].trim().toUpperCase();
    
    // Token 3: Tipo (validação) - pode ser usado para verificação
    const serviceTypeValidation = tokens[3].trim().toUpperCase();
    if (result.serviceType && result.serviceType !== serviceTypeValidation) {
      console.log('⚠️ Inconsistência no tipo de serviço:', result.serviceType, 'vs', serviceTypeValidation);
    }
    
    // Token 4: Response time (ex: "248ms")
    const responseTimeToken = tokens[4].trim();
    const responseTimeMatch = responseTimeToken.match(/(\d+(?:\.\d+)?)(?:ms)?/);
    if (responseTimeMatch) {
      result.responseTime = parseFloat(responseTimeMatch[1]);
    }
    
    // Token 5: Timestamp
    result.timestamp = tokens[5].trim();
    
    console.log('✅ Dados extraídos do formato tokenizado:', result);
    return result;
  }

  /**
   * Parse dos formatos legados (fallback)
   */
  private static parseLegacyFormats(message: string): ParsedServiceData {
    const result: ParsedServiceData = {};
    
    // Padrão 1: "Service leo_19_PING is DOWN"
    const serviceMatch = message.match(/Service\s+([^_\s]+)_(\d+)_(\w+)\s+is\s+(\w+)/i);
    if (serviceMatch) {
      result.serviceName = serviceMatch[1];
      result.serviceId = parseInt(serviceMatch[2]);
      result.serviceType = serviceMatch[3].toUpperCase();
      result.status = serviceMatch[4].toUpperCase();
      console.log('✅ Padrão legacy 1 encontrado:', result);
      return result;
    }
    
    // Padrão 2: "Service: leo_19_PING" ou linha "Service leo_19_PING"
    const altServiceMatch = message.match(/Service[:\s]+([^_\s]+)_(\d+)_(\w+)/i);
    if (altServiceMatch) {
      result.serviceName = altServiceMatch[1];
      result.serviceId = parseInt(altServiceMatch[2]);
      result.serviceType = altServiceMatch[3].toUpperCase();
      console.log('✅ Padrão legacy 2 encontrado:', result);
    }
    
    // Padrão 3: Buscar por linhas separadas (multiline)
    if (!result.serviceName) {
      const lines = message.split('\n');
      for (const line of lines) {
        const lineServiceMatch = line.match(/Service\s+([^_\s]+)_(\d+)_(\w+)/i);
        if (lineServiceMatch) {
          result.serviceName = lineServiceMatch[1];
          result.serviceId = parseInt(lineServiceMatch[2]);
          result.serviceType = lineServiceMatch[3].toUpperCase();
          console.log('✅ Padrão legacy 3 encontrado na linha:', line, result);
          break;
        }
      }
    }
    
    // Extrair status se não foi encontrado
    if (!result.status) {
      result.status = this.extractStatus(message);
    }
    
    // Extrair tipo se não foi encontrado
    if (!result.serviceType) {
      result.serviceType = this.extractServiceType(message);
    }
    
    // Extrair response time se não foi encontrado
    if (!result.responseTime) {
      result.responseTime = this.extractResponseTime(message);
    }
    
    console.log('📋 Dados extraídos (formato legacy):', result);
    return result;
  }

  /**
   * Extrai status da mensagem
   */
  private static extractStatus(message: string): string | undefined {
    const statusMatch = message.match(/Status[:\s]+(\w+)/i);
    if (statusMatch) {
      return statusMatch[1].toUpperCase();
    }
    
    // Tentar encontrar status em "is DOWN" ou "is UP"
    const isStatusMatch = message.match(/is\s+(\w+)/i);
    if (isStatusMatch) {
      return isStatusMatch[1].toUpperCase();
    }
    
    return undefined;
  }

  /**
   * Extrai tipo de serviço da mensagem
   */
  private static extractServiceType(message: string): string | undefined {
    const typeMatch = message.match(/Type[:\s]+(\w+)/i);
    if (typeMatch) {
      return typeMatch[1].toUpperCase();
    }
    
    return undefined;
  }

  /**
   * Extrai tempo de resposta da mensagem
   */
  private static extractResponseTime(message: string): number | undefined {
    const responseTimeMatch = message.match(/response[_\s]?time[:\s]*(\d+(?:\.\d+)?)/i);
    if (responseTimeMatch) {
      return parseFloat(responseTimeMatch[1]);
    }
    
    return undefined;
  }
}
