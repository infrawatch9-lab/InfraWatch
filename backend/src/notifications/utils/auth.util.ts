/**
 * Utilitário para extração segura de dados de autenticação
 */

import { BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from '../notifications.dtos';

export class AuthUtils {
  /**
   * Extrai o ID do usuário de forma segura do request autenticado
   */
  static extractUserId(req: AuthenticatedRequest): number {
    if (!req || !req.user) {
      throw new BadRequestException('Usuário não autenticado ou dados de autenticação inválidos');
    }
    
    const user = req.user;
    const userId = user.userId || user.id || user.sub;
    
    if (!userId) {
      throw new BadRequestException('ID do usuário não encontrado nos dados de autenticação');
    }
    
    return userId;
  }

  /**
   * Verifica se o request está autenticado
   */
  static isAuthenticated(req: AuthenticatedRequest): boolean {
    if (!req || !req.user) return false;
    
    const user = req.user;
    return !!(user.userId || user.id || user.sub);
  }

  /**
   * Extrai dados completos do usuário de forma segura
   */
  static extractUserData(req: AuthenticatedRequest): { id: number; email: string; role: string; name?: string } {
    if (!req || !req.user) {
      throw new BadRequestException('Usuário não autenticado ou dados de autenticação inválidos');
    }
    
    const user = req.user;
    const userId = user.userId || user.id || user.sub;
    
    if (!userId) {
      throw new BadRequestException('ID do usuário não encontrado nos dados de autenticação');
    }
    
    return {
      id: userId,
      email: user.email || '',
      role: user.role || '',
      name: user.name || ''
    };
  }
}
