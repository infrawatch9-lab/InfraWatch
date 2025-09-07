import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { Public } from '../auth/public.decorator';
import { AgentsService } from './agents.service';
import { AgentRegistrationDto, AgentMetricsDto } from './agents.dtos';
import { AuthUtils } from '../notifications/utils/auth.util';
import { AuthenticatedRequest } from '../notifications/notifications.dtos';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('generate-install')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gerar comando de instalação do agente',
    description: 'Gera um comando curl para instalar o agente de monitoramento em um servidor'
  })
  @ApiResponse({
    status: 201,
    description: 'Comando de instalação gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            command: { type: 'string' },
            token: { type: 'string' },
            server_url: { type: 'string' },
            agent_id: { type: 'string' }
          }
        }
      }
    }
  })
  async generateInstallCommand(
    @Request() req: AuthenticatedRequest,
    @Body() body: { hostname: string }
  ) {
    const userId = AuthUtils.extractUserId(req);
    
    if (!body.hostname) {
      throw new BadRequestException('Hostname é obrigatório');
    }

    const installCommand = await this.agentsService.generateInstallCommand(body.hostname, userId);

    return {
      success: true,
      data: installCommand
    };
  }

  @Get('install.sh')
  @Public()
  @ApiOperation({
    summary: 'Script de instalação do agente',
    description: 'Retorna o script bash para instalação do agente de monitoramento'
  })
  async getInstallScript(@Res() res: Response) {
    const installScript = `#!/bin/bash

# InfraWatch Agent Installer
set -e

# Cores para output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Variáveis padrão
AGENT_VERSION="1.0.0"
INSTALL_DIR="/opt/infrawatch-agent"
SERVICE_NAME="infrawatch-agent"
CONFIG_FILE="$INSTALL_DIR/config.json"

# Parse argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --token=*)
      TOKEN="\${1#*=}"
      shift
      ;;
    --server=*)
      SERVER_URL="\${1#*=}"
      shift
      ;;
    --agent-id=*)
      AGENT_ID="\${1#*=}"
      shift
      ;;
    *)
      echo "Argumento desconhecido: $1"
      exit 1
      ;;
  esac
done

# Verificar argumentos obrigatórios
if [ -z "$TOKEN" ] || [ -z "$SERVER_URL" ] || [ -z "$AGENT_ID" ]; then
    echo -e "\${RED}❌ Erro: TOKEN, SERVER_URL e AGENT_ID são obrigatórios\${NC}"
    echo "Uso: curl -fsSL <server>/api/agents/install.sh | bash -s -- --token=<token> --server=<server> --agent-id=<id>"
    exit 1
fi

echo -e "\${GREEN}🚀 Instalando InfraWatch Agent v$AGENT_VERSION...\${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "\${RED}❌ Este script deve ser executado como root\${NC}"
    exit 1
fi

# Detectar sistema operacional
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "\${RED}❌ Não foi possível detectar o sistema operacional\${NC}"
    exit 1
fi

echo -e "\${YELLOW}📋 Sistema detectado: $OS $VERSION\${NC}"

# Instalar dependências
echo -e "\${YELLOW}📦 Instalando dependências...\${NC}"
case $OS in
    ubuntu|debian)
        apt-get update
        apt-get install -y curl jq python3 python3-pip
        pip3 install psutil requests
        ;;
    centos|rhel|fedora)
        yum update -y
        yum install -y curl jq python3 python3-pip
        pip3 install psutil requests
        ;;
    *)
        echo -e "\${RED}❌ Sistema operacional não suportado: $OS\${NC}"
        exit 1
        ;;
esac

# Criar diretório de instalação
echo -e "\${YELLOW}📁 Criando diretório de instalação...\${NC}"
mkdir -p $INSTALL_DIR

# Baixar agente
echo -e "\${YELLOW}⬇️ Baixando agente...\${NC}"
cat > $INSTALL_DIR/agent.py << 'EOF'
#!/usr/bin/env python3
import json
import time
import psutil
import requests
import socket
import platform
import os
import sys
from datetime import datetime

class InfraWatchAgent:
    def __init__(self, config_file):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        self.hostname = socket.gethostname()
        self.server_url = self.config['server_url']
        self.token = self.config['token']
        self.agent_id = self.config['agent_id']
        self.interval = self.config.get('interval', 60)  # 60 segundos por padrão
        
    def register(self):
        """Registra o agente no servidor"""
        try:
            data = {
                'hostname': self.hostname,
                'ip': self.get_ip(),
                'os': platform.system(),
                'arch': platform.machine(),
                'version': '1.0.0'
            }
            
            response = requests.post(
                f"{self.server_url}/api/agents/register",
                json=data,
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                print(f"✅ Agente {self.hostname} registrado com sucesso")
                return True
            else:
                print(f"❌ Erro ao registrar agente: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na conexão com servidor: {e}")
            return False
    
    def get_ip(self):
        """Obtém IP da máquina"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def collect_metrics(self):
        """Coleta métricas do sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else (0, 0, 0)
            
            # Memória
            memory = psutil.virtual_memory()
            
            # Disco
            disk_info = []
            for partition in psutil.disk_partitions():
                try:
                    disk_usage = psutil.disk_usage(partition.mountpoint)
                    disk_info.append({
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'total': disk_usage.total,
                        'used': disk_usage.used,
                        'free': disk_usage.free,
                        'usage_percent': (disk_usage.used / disk_usage.total) * 100
                    })
                except:
                    continue
            
            # Rede
            network_info = []
            net_io = psutil.net_io_counters(pernic=True)
            for interface, stats in net_io.items():
                network_info.append({
                    'interface': interface,
                    'bytes_sent': stats.bytes_sent,
                    'bytes_recv': stats.bytes_recv,
                    'packets_sent': stats.packets_sent,
                    'packets_recv': stats.packets_recv
                })
            
            # Processos
            processes = list(psutil.process_iter(['status']))
            process_counts = {
                'total': len(processes),
                'running': len([p for p in processes if p.info['status'] == 'running']),
                'sleeping': len([p for p in processes if p.info['status'] == 'sleeping']),
                'zombie': len([p for p in processes if p.info['status'] == 'zombie']),
            }
            
            return {
                'hostname': self.hostname,
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'usage': cpu_percent,
                    'cores': cpu_count,
                    'load1': load_avg[0],
                    'load5': load_avg[1],
                    'load15': load_avg[2]
                },
                'memory': {
                    'total': memory.total,
                    'used': memory.used,
                    'free': memory.free,
                    'available': memory.available,
                    'usage_percent': memory.percent
                },
                'disk': disk_info,
                'network': network_info,
                'processes': process_counts,
                'uptime': int(time.time() - psutil.boot_time())
            }
            
        except Exception as e:
            print(f"❌ Erro ao coletar métricas: {e}")
            return None
    
    def send_metrics(self, metrics):
        """Envia métricas para o servidor"""
        try:
            response = requests.post(
                f"{self.server_url}/api/agents/metrics",
                json=metrics,
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                print(f"📊 Métricas enviadas - CPU: {metrics['cpu']['usage']:.1f}%, RAM: {metrics['memory']['usage_percent']:.1f}%")
                return True
            else:
                print(f"❌ Erro ao enviar métricas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False
    
    def run(self):
        """Loop principal do agente"""
        print(f"🚀 InfraWatch Agent v1.0.0 iniciado")
        print(f"🖥️ Hostname: {self.hostname}")
        print(f"🌐 Servidor: {self.server_url}")
        print(f"⏰ Intervalo: {self.interval}s")
        
        # Registrar agente
        if not self.register():
            print("❌ Falha no registro. Tentando novamente em 60s...")
            time.sleep(60)
            return self.run()
        
        # Loop de coleta
        while True:
            try:
                metrics = self.collect_metrics()
                if metrics:
                    self.send_metrics(metrics)
                else:
                    print("⚠️ Falha na coleta de métricas")
                
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                print("\\n🛑 Agente interrompido pelo usuário")
                break
            except Exception as e:
                print(f"❌ Erro no loop principal: {e}")
                time.sleep(self.interval)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 agent.py <config_file>")
        sys.exit(1)
    
    agent = InfraWatchAgent(sys.argv[1])
    agent.run()
EOF

# Criar arquivo de configuração
echo -e "\${YELLOW}⚙️ Criando configuração...\${NC}"
cat > $CONFIG_FILE << EOF
{
    "server_url": "$SERVER_URL",
    "token": "$TOKEN",
    "agent_id": "$AGENT_ID",
    "interval": 60
}
EOF

# Tornar executável
chmod +x $INSTALL_DIR/agent.py

# Criar serviço systemd
echo -e "\${YELLOW}🔧 Criando serviço systemd...\${NC}"
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=InfraWatch Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/agent.py $CONFIG_FILE
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e iniciar serviço
echo -e "\${YELLOW}▶️ Iniciando serviço...\${NC}"
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Verificar status
if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "\${GREEN}✅ InfraWatch Agent instalado e executando com sucesso!\${NC}"
    echo -e "\${YELLOW}📋 Comandos úteis:\${NC}"
    echo -e "  Status:  systemctl status $SERVICE_NAME"
    echo -e "  Logs:    journalctl -u $SERVICE_NAME -f"
    echo -e "  Parar:   systemctl stop $SERVICE_NAME"
    echo -e "  Iniciar: systemctl start $SERVICE_NAME"
else
    echo -e "\${RED}❌ Erro ao iniciar o serviço\${NC}"
    echo -e "Verifique os logs: journalctl -u $SERVICE_NAME"
    exit 1
fi
`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="install.sh"');
    res.send(installScript);
  }

  @Post('register')
  @UseGuards(AgentAuthGuard)
  @Public()
  @ApiOperation({
    summary: 'Registrar agente',
    description: 'Endpoint para agentes se registrarem no sistema'
  })
  async registerAgent(
    @Request() req: any,
    @Body() agentData: AgentRegistrationDto
  ) {
    const agentId = req.agent?.agent_id || req.agent?.id;
    
    if (!agentId) {
      throw new BadRequestException('Token de agente inválido');
    }

    const registeredAgent = await this.agentsService.registerAgent(agentData, agentId);

    return {
      success: true,
      data: registeredAgent
    };
  }

  @Post('metrics')
  @UseGuards(AgentAuthGuard)
  @Public()
  @ApiOperation({
    summary: 'Receber métricas do agente',
    description: 'Endpoint para agentes enviarem métricas de monitoramento'
  })
  async receiveMetrics(
    @Request() req: any,
    @Body() metrics: AgentMetricsDto
  ) {
    const agentId = req.agent?.agent_id || req.agent?.id;
    
    if (!agentId) {
      throw new BadRequestException('Token de agente inválido');
    }

    await this.agentsService.processMetrics(metrics, agentId);

    return {
      success: true,
      message: 'Métricas processadas com sucesso'
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar agentes',
    description: 'Lista todos os agentes de monitoramento do usuário'
  })
  async getAgents(@Request() req: AuthenticatedRequest) {
    const userId = AuthUtils.extractUserId(req);
    const agents = await this.agentsService.getAgents(userId);

    return {
      success: true,
      data: agents
    };
  }

  @Get(':agentId/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter métricas do agente',
    description: 'Obtém métricas recentes de um agente específico'
  })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Horas de histórico (padrão: 24)' })
  async getAgentMetrics(
    @Request() req: AuthenticatedRequest,
    @Param('agentId') agentId: string,
    @Query('hours') hours: string = '24'
  ) {
    const userId = AuthUtils.extractUserId(req);
    const hoursNum = parseInt(hours, 10) || 24;
    
    // Verificar se o agente pertence ao usuário
    const agents = await this.agentsService.getAgents(userId);
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new BadRequestException('Agente não encontrado');
    }

    const metrics = await this.agentsService.getAgentMetrics(agentId, hoursNum);

    return {
      success: true,
      data: {
        agent: agent,
        metrics: metrics
      }
    };
  }

  @Delete(':agentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover agente',
    description: 'Remove um agente e todas suas métricas'
  })
  async removeAgent(
    @Request() req: AuthenticatedRequest,
    @Param('agentId') agentId: string
  ) {
    const userId = AuthUtils.extractUserId(req);
    await this.agentsService.removeAgent(agentId, userId);

    return {
      success: true,
      message: 'Agente removido com sucesso'
    };
  }
}
