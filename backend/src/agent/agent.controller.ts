import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo agente por host' })
  @ApiResponse({ status: 201, description: 'Agente cadastrado com sucesso' })
  async register(@Body() dto: { host: string }) {
    if (!dto.host) throw new NotFoundException('Host é obrigatório');
    const agent = await this.prisma.agent.upsert({
      where: { host: dto.host },
      create: { host: dto.host },
      update: {},
    });
    return agent;
  }

  @Get(':host')
  @ApiOperation({ summary: 'Buscar agente por host' })
  @ApiResponse({ status: 200, description: 'Agente encontrado' })
  async getByHost(@Param('host') host: string) {
    const agent = await this.prisma.agent.findUnique({ where: { host } });
    if (!agent) throw new NotFoundException('Agente não encontrado');
    return agent;
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agentes' })
  async list() {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
