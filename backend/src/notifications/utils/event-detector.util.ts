/**
 * Utilitário para detecção de tipos de eventos baseados em mensagens
 */

import { ParsedServiceData } from './message-parser.util';

export type EventType = 'ALERT' | 'RESOLVED' | 'WARNING' | 'MAINTENANCE' | 'INCIDENT' | 'INFO';

export class EventDetectorUtil {
  /**
   * Detecta o tipo de evento baseado na mensagem e dados extraídos
   */
  static detectEventType(message: string, messageData: ParsedServiceData): EventType {
    // Primeiro: usar tipo de incidente do formato tokenizado
    if (messageData.incidentType) {
      return this.mapIncidentTypeToEvent(messageData.incidentType, messageData.status);
    }
    
    // Fallback: análise do texto da mensagem (formato antigo)
    return this.detectFromMessageText(message);
  }

  /**
   * Mapeia tipos de incidente para eventos
   */
  private static mapIncidentTypeToEvent(incidentType: string, status?: string): EventType {
    const type = incidentType.toUpperCase();
    
    switch (type) {
      case 'INFO':
        // Para INFO, usar o status para determinar o evento
        if (status === 'UP') {
          return 'RESOLVED';
        } else if (status === 'DOWN') {
          return 'ALERT';
        }
        return 'INFO';
        
      case 'ALERT':
      case 'CRITICAL':
      case 'ERROR':
        return 'ALERT';
        
      case 'WARNING':
      case 'WARN':
        return 'WARNING';
        
      case 'RESOLVED':
      case 'RECOVERY':
      case 'OK':
        return 'RESOLVED';
        
      case 'MAINTENANCE':
        return 'MAINTENANCE';
        
      case 'INCIDENT':
        return 'INCIDENT';
        
      default:
        // Se não reconhecer o tipo, usar o status
        if (status === 'UP') {
          return 'RESOLVED';
        } else if (status === 'DOWN') {
          return 'ALERT';
        }
        return 'INFO';
    }
  }

  /**
   * Detecta evento a partir do texto da mensagem (fallback)
   */
  private static detectFromMessageText(message: string): EventType {
    const upperMessage = message.toUpperCase();
    
    if (upperMessage.includes('DOWN') || upperMessage.includes('FAILED')) {
      return 'ALERT';
    } else if (upperMessage.includes('UP') || upperMessage.includes('RESTORED')) {
      return 'RESOLVED';
    } else if (upperMessage.includes('WARNING') || upperMessage.includes('DEGRADED')) {
      return 'WARNING';
    } else if (upperMessage.includes('MAINTENANCE')) {
      return 'MAINTENANCE';
    } else if (upperMessage.includes('INCIDENT')) {
      return 'INCIDENT';
    }
    
    return 'ALERT'; // Default
  }
}
