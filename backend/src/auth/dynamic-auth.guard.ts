import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AgentAuthGuard } from './agent-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class DynamicAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('DynamicAuthGuard initialized');
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }
    if (!authHeader)
      throw new UnauthorizedException();

    const token = authHeader.split(' ')[1];
    const decoded = this.jwtService.decode(token) as any;

    if (decoded?.role === 'ADMIN' || decoded?.role === 'USER') {
      return new JwtAuthGuard(this.reflector).canActivate(context);
    } else if (decoded?.host) {
      return new AgentAuthGuard().canActivate(context);
    }

    throw new UnauthorizedException('Tipo de token não reconhecido');
  }
}
