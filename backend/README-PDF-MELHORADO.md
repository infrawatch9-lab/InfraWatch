# Sistema de Relatórios PDF SLA - Dashboard Profissional

Este sistema gera relatórios SLA com visual de dashboard profissional, cores vibrantes e dados realistas de monitoramento.

## 🎨 Melhorias Visuais Implementadas

### Visual Dashboard Profissional

- **Cabeçalho colorido** com fundo azul escuro (#1e3a8a)
- **Logo simulado** "IW" em destaque
- **Status badges** coloridos (OPERACIONAL/ATENÇÃO/CRÍTICO)
- **Cards métricos** com cores baseadas em performance:
  - 🟢 Verde: Excelente performance
  - 🟡 Amarelo: Atenção necessária
  - 🔴 Vermelho: Situação crítica

### Dados Realistas de Monitoramento

- **5 tipos de serviços** com métricas específicas:
  - API Gateway Principal (99.94% uptime)
  - Banco PostgreSQL Produção (99.97% uptime)
  - Load Balancer NGINX (99.99% uptime)
  - Redis Cache Cluster (99.92% uptime)
  - Portal Web Corporativo (99.89% uptime)

### Métricas Avançadas

- **Disponibilidade** com target SLA
- **Tempo de resposta** (P95, P99)
- **Taxa de erro** com volume de requests
- **Uptime/Downtime** detalhado
- **Infraestrutura**: CPU, Memória, Disco
- **Throughput de rede**

## 📊 Componentes Visuais

### 1. Cabeçalho Profissional

```
┌─────────────────────────────────────────────────────┐
│ [IW] RELATÓRIO SLA               OPERACIONAL        │
│      Service Level Agreement Report                │
│      Gerado em: 12/08/2025 15:49:28               │
└─────────────────────────────────────────────────────┘
```

### 2. Cards de Métricas (4 colunas)

```
┌─────────┬─────────┬─────────┬─────────┐
│ 99.94%  │ 85.2ms  │ 0.060%  │ 719.8h │
│DISPONI- │ TEMPO   │ TAXA DE │ UPTIME  │
│BILIDADE │RESPOSTA │ ERRO    │         │
│Target:  │P95:153ms│1,704    │⬇ 0.2h  │
│99.9%    │P99:204ms│errors   │downtime │
└─────────┴─────────┴─────────┴─────────┘
```

### 3. Barras de Progresso de Infraestrutura

```
CPU     ████████░░ 45.2%
Memória ██████████ 67.8%
Disco   ███░░░░░░░ 34.1%
🌐 Throughput de Rede: 245.7 MB/s
```

### 4. Gráfico de Tendência (7 dias)

```
100% ┤     ●●●
 99% ┤ ●●●     ●
 98% ┤
 97% ┤
 96% ┤
     └─────────────
     Seg Ter Qua Qui Sex Sab Dom
```

### 5. Incidentes com Severidade Visual

```
🚨 Falha de Conectividade Crítica    [RESOLVED]
   ID: CRIT-001 | 2,847 usuários afetados
   ⏰ 10/08/2025 14:25 - 10/08/2025 16:45

🚨 Degradação de Performance         [RESOLVED]
   ID: MIN-001 | 342 usuários afetados
   ⏰ 11/08/2025 09:15 - 11/08/2025 09:35
```

## 🎯 Funcionalidades Testadas

### Serviços Diversos

- Cada ID de serviço (0-4) retorna dados diferentes
- Métricas realistas baseadas no tipo de serviço
- Incidentes específicos por categoria

### Cores Inteligentes

- **Verde** (#10b981): SLA > 99.9% | Latência < 100ms | Erro < 0.1%
- **Amarelo** (#f59e0b): SLA > 99.0% | Latência < 500ms | Erro < 1.0%
- **Vermelho** (#ef4444): SLA < 99.0% | Latência > 500ms | Erro > 1.0%

### Dados de Produção

- Volume realista: 2.8M+ requisições
- Tempo de resposta: 1.8ms (Redis) a 234ms (Web)
- Incidentes detalhados com usuários impactados
- Métricas de infraestrutura (CPU, RAM, Disk)

## 📋 Endpoints Ativos

### Gerar PDF Demo (com salvamento)

```bash
GET /api/api/sla/reports/demo
```

**Resposta:**

```json
{
  "success": true,
  "message": "Relatório demo gerado com sucesso",
  "filename": "sla-demo-report-2025-08-12T14-49-28-176Z.pdf",
  "downloadUrl": "/api/sla/reports/download/filename.pdf",
  "viewUrl": "/api/sla/reports/view/filename.pdf"
}
```

### Gerar PDF Demo (download direto)

```bash
GET /api/api/sla/reports/demo-pdf
```

Retorna PDF profissional de 2 páginas com visual de dashboard.

### Gerenciar PDFs

```bash
GET /api/api/sla/reports/list           # Listar
GET /api/api/sla/reports/download/:file # Baixar
GET /api/api/sla/reports/view/:file     # Visualizar
GET /api/api/sla/reports/delete/:file   # Deletar
```

## 🔧 Como Testar Diferentes Serviços

```bash
# API Gateway (ID 0)
curl "http://localhost:3000/api/api/sla/reports/demo-pdf" -o gateway.pdf

# Banco PostgreSQL (ID 1)
curl "http://localhost:3000/api/api/sla/reports/generate/1" -X POST

# Load Balancer (ID 2)
curl "http://localhost:3000/api/api/sla/reports/generate/2" -X POST

# Redis Cache (ID 3)
curl "http://localhost:3000/api/api/sla/reports/generate/3" -X POST

# Portal Web (ID 4)
curl "http://localhost:3000/api/api/sla/reports/generate/4" -X POST
```

## 📈 Novos Dados Demo

- **Período**: Últimos 30 dias (mais realista)
- **Volume**: 189K a 12.8M requisições por serviço
- **Precisão**: Métricas P95/P99 de latência
- **Contexto**: Dados específicos por tipo de infraestrutura
- **Incidentes**: Severidade visual e impacto detalhado

## 🎨 Design System

### Paleta de Cores

- **Primary**: #1e3a8a (Azul escuro)
- **Secondary**: #3b82f6 (Azul médio)
- **Success**: #10b981 (Verde)
- **Warning**: #f59e0b (Laranja)
- **Danger**: #ef4444 (Vermelho)
- **Info**: #06b6d4 (Cyan)

### Layout Responsivo

- PDF otimizado para A4
- Quebra de página automática
- Rodapé profissional com segurança
- Tipografia hierárquica

## ✅ Melhorias Implementadas

### Antes (PDF simples)

- Dados fictícios "Serviço Demo 999"
- Layout básico sem cores
- 1 página com informações limitadas
- Visual corporativo genérico

### Depois (PDF Dashboard)

- 5 serviços realistas com dados específicos
- Cabeçalho colorido com status visual
- 2 páginas com métricas completas
- Gráfico de tendência simulado
- Barras de progresso de infraestrutura
- Incidentes detalhados com impacto
- Paleta de cores profissional
- Layout de dashboard moderno

O sistema agora gera PDFs que parecem dashboards profissionais de monitoramento, com dados realistas e visual corporativo!
