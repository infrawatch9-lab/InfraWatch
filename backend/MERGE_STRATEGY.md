# Data Merging Strategy: Database + CheckCle

## 📋 Overview

Esta implementação resolve o problema de como combinar dados do banco de dados (fonte da verdade dos serviços) com dados de monitoramento em tempo real do CheckCle.

## 🏗️ Arquitetura

### 🗄️ Banco de Dados (Source of Truth)
**Fornece:**
- `id` - Identificador único do serviço
- `name` - Nome do serviço
- `type` - Tipo do serviço (PING, HTTP, SNMP, WEBHOOK)
- `status` - Status do serviço (ACTIVE, INACTIVE, etc.)
- `description` - Descrição do serviço
- `targetSLA` - Meta de SLA definida
- `team` - Equipe responsável
- `usersToNotify` - Usuários para notificação

### ⚡ CheckCle (Real-time Monitoring)
**Fornece:**
- `last_checked` - Último momento de verificação
- `response_time` - Tempo de resposta em ms
- `uptime` - Tempo de atividade (%)

### 🔄 Merge Process
**Resultado final:**
```json
{
  "id": 11,
  "name": "postgres",
  "type": "PING",
  "status": "ACTIVE",
  "description": "Monitoramento do servidor de banco de dados principal - PostgreSQL",
  "targetSLA": 99.9,
  "lastChecked": "2025-09-06T11:34:17.000Z",
  "responseTime": 11,
  "uptime": 0,
  "team": {
    "id": 2,
    "name": "Team 2"
  },
  "usersToNotify": [
    {
      "id": 1,
      "name": "Watch Dog",
      "email": "gkombadev@gmail.com",
      "role": "VIEWER"
    }
  ]
}
```

## 🚀 Implementação

### 1. Ping Service (`ping.service.ts`)

#### `mergeServiceWithCheckcleData()` - Método Principal
- **Entrada:** Dados do serviço do banco de dados
- **Processo:**
  1. Extrai dados base do banco (configuração do serviço)
  2. Tenta buscar dados de monitoramento do CheckCle
  3. Faz merge dos dados em uma resposta consistente
- **Saída:** JSON unificado com todos os dados

#### `findOne()` - Busca Individual
- Busca serviço no banco com todas as relações
- Aplica merge automático com dados do CheckCle
- Retorna dados completos

#### `findAll()` - Busca em Lote
- Busca todos os serviços PING
- Aplica merge para cada serviço individualmente
- Retorna array de serviços com dados completos

### 2. Ping Controller (`ping.controller.ts`)

#### Novo Endpoint: `GET /ping/:id/merged`
- Busca dados mesclados para um serviço específico
- Documentação Swagger completa com exemplo
- Response schema definido

### 3. Services Controller (`services.controller.ts`)

#### Novo Endpoint: `GET /services/:id/merged`
- Identifica tipo do serviço
- Chama método apropriado para merge
- Funciona para todos os tipos de serviço

#### Novo Endpoint: `GET /services/merged`
- Lista todos os serviços com dados mesclados
- Combina resultados de todos os tipos
- Performance otimizada com Promise.all

## ⚠️ Resiliência

### Fallback Strategy
Se o CheckCle não estiver disponível:
```typescript
// Fallback para dados apenas do banco
{
  // ...dados do banco...
  lastChecked: null,
  responseTime: null,
  uptime: 0
}
```

### Error Handling
- ✅ Logs de warning quando CheckCle não responde
- ✅ Continua operação mesmo com falha do CheckCle
- ✅ Retorna dados do banco como fallback
- ✅ Não bloqueia operações críticas

## 🛣️ Endpoints Disponíveis

### Ping Services
- `GET /ping` - Lista todos (dados mesclados)
- `GET /ping/:id` - Busca um (dados mesclados)
- `GET /ping/:id/merged` - Busca um (explicitamente mesclado)
- `GET /ping/:id/checkcle-status` - Só dados do CheckCle

### All Services
- `GET /services` - Lista todos (dados originais)
- `GET /services/merged` - Lista todos (dados mesclados)
- `GET /services/:id` - Busca um (dados originais)
- `GET /services/:id/merged` - Busca um (dados mesclados)

## 🎯 Benefícios

1. **Single Source of Truth:** Banco de dados mantém controle das configurações
2. **Real-time Data:** CheckCle fornece métricas atualizadas
3. **Resilient:** Funciona mesmo se CheckCle estiver offline
4. **Consistent API:** Sempre retorna mesma estrutura JSON
5. **Performance:** Busca otimizada com Promise.all
6. **Backward Compatible:** Endpoints antigos continuam funcionando

## 🔧 Próximos Passos

Para aplicar o mesmo padrão aos outros tipos de serviço:

1. **HTTP Service:** Implementar `mergeServiceWithCheckcleData()`
2. **SNMP Service:** Implementar `mergeServiceWithCheckcleData()`
3. **Webhook Service:** Implementar `mergeServiceWithCheckcleData()`

Cada um seguirá o mesmo padrão estabelecido no Ping Service.
