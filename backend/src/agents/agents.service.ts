import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '../auth/jwt.service';
import { AgentRegistrationDto, AgentMetricsDto, AgentInstallCommand, RegisteredAgent } from './agents.dtos';
import * as crypto from 'crypto';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Gera comando de instalação para um novo agente
   */
  async generateInstallCommand(hostname: string, userId: number): Promise<AgentInstallCommand> {
    try {
      // Gerar ID único para o agente
      const agentId = crypto.randomUUID();
      
      // Gerar token JWT para o agente (válido por 30 dias)
      const token = this.jwtService.sign({
        agent_id: agentId,
        hostname: hostname,
        type: 'agent',
        iat: Math.floor(Date.now() / 1000)
        // Removido exp manual para usar expiresIn do JwtService
      }, '30d');

      // Salvar agente pendente no banco
      await this.prisma.agent.create({
        data: {
          id: agentId,
          hostname: hostname,
          token: token,
          status: 'PENDING',
          userId: userId,
          ip: '', // Será preenchido quando o agente se conectar
          os: '', // Será preenchido quando o agente se conectar
          arch: '', // Será preenchido quando o agente se conectar
        }
      });

      const serverUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      // Comando de instalação para Linux/Unix
      const installCommand = `curl -fsSL ${serverUrl}/api/agents/install.sh | bash -s -- --token="${token}" --server="${serverUrl}" --agent-id="${agentId}"`;

      return {
        command: installCommand,
        token: token,
        server_url: serverUrl,
        agent_id: agentId
      };

    } catch (error) {
      console.error('❌ Erro ao gerar comando de instalação:', error);
      throw new BadRequestException('Erro ao gerar comando de instalação do agente');
    }
  }

  /**
   * Registra um agente quando ele se conecta pela primeira vez
   */
  async registerAgent(agentData: AgentRegistrationDto, agentId: string): Promise<RegisteredAgent> {
    try {
      const agent = await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          hostname: agentData.hostname,
          ip: agentData.ip,
          os: agentData.os,
          arch: agentData.arch,
          version: agentData.version || '1.0.0',
          status: 'ACTIVE',
          lastSeen: new Date(),
        }
      });

      console.log(`✅ Agente ${agentData.hostname} registrado com sucesso`);

      return {
        id: agent.id,
        hostname: agent.hostname,
        ip: agent.ip,
        os: agent.os,
        arch: agent.arch,
        version: agent.version || '1.0.0',
        token: agent.token,
        status: agent.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        last_seen: agent.lastSeen || new Date(),
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      };

    } catch (error) {
      console.error('❌ Erro ao registrar agente:', error);
      throw new BadRequestException('Erro ao registrar agente');
    }
  }

  /**
   * Processa métricas enviadas pelo agente
   */
  async processMetrics(metrics: AgentMetricsDto, agentId: string): Promise<void> {
    try {
      // Atualizar last_seen do agente
      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          lastSeen: new Date(),
          status: 'ACTIVE'
        }
      });

      // Salvar métricas no banco
      await this.prisma.agentMetrics.create({
        data: {
          agentId: agentId,
          hostname: metrics.hostname,
          timestamp: new Date(metrics.timestamp),
          cpuUsage: metrics.cpu.usage,
          cpuCores: metrics.cpu.cores,
          load1: metrics.cpu.load1,
          load5: metrics.cpu.load5,
          load15: metrics.cpu.load15,
          memoryTotal: metrics.memory.total,
          memoryUsed: metrics.memory.used,
          memoryFree: metrics.memory.free,
          memoryAvailable: metrics.memory.available,
          memoryUsagePercent: metrics.memory.usage_percent,
          diskData: JSON.stringify(metrics.disk),
          networkData: JSON.stringify(metrics.network),
          processesTotal: metrics.processes.total,
          processesRunning: metrics.processes.running,
          processesSleeping: metrics.processes.sleeping,
          processesZombie: metrics.processes.zombie,
          uptime: metrics.uptime,
        }
      });

      console.log(`📊 Métricas processadas para agente ${metrics.hostname}`);

    } catch (error) {
      console.error('❌ Erro ao processar métricas:', error);
      throw new BadRequestException('Erro ao processar métricas do agente');
    }
  }

  /**
   * Lista todos os agentes de um usuário
   */
  async getAgents(userId: number): Promise<RegisteredAgent[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
      });

      return agents.map(agent => ({
        id: agent.id,
        hostname: agent.hostname,
        ip: agent.ip,
        os: agent.os,
        arch: agent.arch,
        version: agent.version || '1.0.0',
        token: agent.token,
        status: agent.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        last_seen: agent.lastSeen || new Date(),
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar agentes:', error);
      throw new BadRequestException('Erro ao buscar agentes');
    }
  }

  /**
   * Obtém métricas recentes de um agente
   */
  async getAgentMetrics(agentId: string, hours: number = 24): Promise<any[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const metrics = await this.prisma.agentMetrics.findMany({
        where: {
          agentId: agentId,
          timestamp: {
            gte: since
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 // Limite de segurança
      });

      return metrics.map(metric => ({
        timestamp: metric.timestamp,
        cpu: {
          usage: metric.cpuUsage,
          cores: metric.cpuCores,
          load1: metric.load1,
          load5: metric.load5,
          load15: metric.load15,
        },
        memory: {
          total: metric.memoryTotal,
          used: metric.memoryUsed,
          free: metric.memoryFree,
          available: metric.memoryAvailable,
          usage_percent: metric.memoryUsagePercent,
        },
        disk: JSON.parse(metric.diskData || '[]'),
        network: JSON.parse(metric.networkData || '[]'),
        processes: {
          total: metric.processesTotal,
          running: metric.processesRunning,
          sleeping: metric.processesSleeping,
          zombie: metric.processesZombie,
        },
        uptime: metric.uptime,
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar métricas do agente:', error);
      throw new BadRequestException('Erro ao buscar métricas do agente');
    }
  }

  /**
   * Remove um agente
   */
  async removeAgent(agentId: string, userId: number): Promise<void> {
    try {
      // Verificar se o agente pertence ao usuário
      const agent = await this.prisma.agent.findFirst({
        where: {
          id: agentId,
          userId: userId
        }
      });

      if (!agent) {
        throw new NotFoundException('Agente não encontrado');
      }

      // Remover métricas do agente
      await this.prisma.agentMetrics.deleteMany({
        where: { agentId: agentId }
      });

      // Remover agente
      await this.prisma.agent.delete({
        where: { id: agentId }
      });

      console.log(`🗑️ Agente ${agentId} removido com sucesso`);

    } catch (error) {
      console.error('❌ Erro ao remover agente:', error);
      throw new BadRequestException('Erro ao remover agente');
    }
  }
}
