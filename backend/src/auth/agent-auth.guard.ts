import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyTokenAgent } from './jwt.service';
import { AgentRequest } from './auth.entity';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AgentRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de agente ausente ou inválido');
    }

    const token = authHeader.split(' ')[1];
    try {
      const agentPayload = verifyTokenAgent(token);
      request.agent = agentPayload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
