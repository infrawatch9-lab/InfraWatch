# WebSocket Gateway - Arquitetura Refatorada

## 📋 Visão Geral

O WebSocket Gateway foi refatorado para seguir os princípios de **Separation of Concerns** e **Single Responsibility Principle**, dividindo as funcionalidades em módulos especializados.

## 🏗️ Arquitetura

```
src/ws/
├── microservices.gateway.ts     # Gateway principal (orquestrador)
├── connection-manager.service.ts # Gerenciamento de conexões
├── message-cache.service.ts     # Cache de mensagens
├── message-router.service.ts    # Roteamento de mensagens
├── alert-processor.service.ts   # Processamento de alertas
├── gateway-admin.service.ts     # Administração e estatísticas
└── ws.module.ts                # Módulo WebSocket
```

## 🔧 Serviços

### 1. **ConnectionManager**
Gerencia conexões de microserviços conectados.

**Responsabilidades:**
- Registrar/desregistrar microserviços
- Manter lista de conexões ativas
- Detectar conexões inativas
- Fornecer estatísticas de conexão

**Principais métodos:**
```typescript
registerService(serviceId: string, socket: Socket): boolean
unregisterBySocket(socketId: string): string | null
getConnectedServiceIds(): string[]
isServiceConnected(serviceId: string): boolean
```

### 2. **MessageCacheService**
Gerencia cache de mensagens para evitar duplicatas.

**Responsabilidades:**
- Detectar mensagens duplicadas
- Gerenciar TTL do cache
- Limpar entradas expiradas

**Principais métodos:**
```typescript
generateMessageKey(from: string, serviceId: string, status: string): string
isMessageProcessed(messageKey: string): boolean
markMessageAsProcessed(messageKey: string): void
clearCache(): number
```

### 3. **MessageRouterService**
Roteia mensagens entre microserviços.

**Responsabilidades:**
- Enviar mensagens diretas
- Fazer broadcast para todos os serviços
- Gerenciar mensagens do gateway

**Principais métodos:**
```typescript
routeMessage(data: MessagePayload): BroadcastResult | DirectMessageResult
sendFromGateway(to: string, payload: any): BroadcastResult | DirectMessageResult
```

### 4. **AlertProcessorService**
Processa alertas de serviços.

**Responsabilidades:**
- Atualizar status de serviços no banco
- Criar notificações para usuários
- Enviar alertas por email
- Gerenciar alertas para administradores

**Principais métodos:**
```typescript
processServiceAlert(alert: ServiceAlert): Promise<void>
```

### 5. **GatewayAdminService**
Fornece funcionalidades administrativas.

**Responsabilidades:**
- Estatísticas do gateway
- Health checks
- Limpeza de cache
- Desconexão forçada de serviços

**Principais métodos:**
```typescript
getGatewayStats(): Promise<GatewayStats>
clearMessageCache(): ClearResult
getConnectedServices(): ServicesList
```

## 🎯 Benefícios da Refatoração

### ✅ **Antes (Problemas)**
- Classe monolítica com muitas responsabilidades
- Difícil manutenção e teste
- Código duplicado
- Acoplamento alto entre funcionalidades

### ✅ **Depois (Soluções)**
- **Separation of Concerns**: Cada serviço tem uma responsabilidade específica
- **Testabilidade**: Serviços podem ser testados independentemente
- **Manutenibilidade**: Mudanças em uma funcionalidade não afetam outras
- **Reutilização**: Serviços podem ser reutilizados em outros contextos
- **Escalabilidade**: Fácil adicionar novas funcionalidades

## 🚀 Como Usar

### WebSocket Events

```typescript
// Registrar microserviço
client.emit('register', { id: 'service-name' });

// Enviar mensagem
client.emit('message', { 
  from: 'service-a', 
  to: 'service-b', 
  payload: { data: 'example' } 
});

// Receber alerta
client.emit('receive_message', {
  from: 'monitoring-service',
  payload: {
    serviceId: 123,
    status: 'DOWN',
    message: 'Service is offline',
    recipients: ['admin@example.com']
  },
  timestamp: '2025-08-30T10:00:00Z'
});

// Obter estatísticas
client.emit('gateway_stats');

// Limpar cache
client.emit('clear_message_cache');
```

## 📊 APIs REST para Notificações

```typescript
// Buscar notificações
GET /notifications?page=1&limit=20&unreadOnly=false

// Contar não lidas
GET /notifications/unread-count

// Marcar como lida
POST /notifications/:id/mark-read

// Marcar todas como lidas
POST /notifications/mark-all-read

// Criar notificação
POST /notifications
{
  "userId": 1,
  "message": "Alerta de sistema",
  "type": "EMAIL",
  "channel": "EMAIL"
}
```

## 🔧 Configuração

### Injeção de Dependência
```typescript
@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    NotificationsManagerModule
  ],
  providers: [
    MicroservicesGateway,
    ConnectionManager,
    MessageCacheService,
    MessageRouterService,
    AlertProcessorService,
    GatewayAdminService
  ]
})
export class MicroservicesModule {}
```

## 🧪 Testes

Cada serviço pode ser testado independentemente:

```typescript
describe('ConnectionManager', () => {
  it('should register service successfully', () => {
    const connectionManager = new ConnectionManager();
    const result = connectionManager.registerService('test-service', mockSocket);
    expect(result).toBe(true);
  });
});
```

## 📈 Monitoramento

### Estatísticas Disponíveis
- Conexões ativas
- Mensagens processadas
- Cache de mensagens
- Status dos serviços
- Uso de memória

### Health Check
```typescript
GET /gateway/health
{
  "status": "healthy",
  "uptime": 3600,
  "checks": {
    "connections": { "status": "ok", "count": 5 },
    "cache": { "status": "ok", "entries": 120 },
    "memory": { "status": "ok", "heapUsed": 52428800 }
  }
}
```

## 🔄 Migração

### Para migrar do código antigo:
1. ✅ **ConnectionManager** substitui gerenciamento manual de `connections`
2. ✅ **MessageCacheService** substitui `processedMessages` Map
3. ✅ **MessageRouterService** substitui lógica de roteamento manual
4. ✅ **AlertProcessorService** substitui `createNotificationForService`
5. ✅ **GatewayAdminService** centraliza funções administrativas

### Compatibilidade
- ✅ Todos os eventos WebSocket continuam funcionando
- ✅ APIs REST mantêm mesma interface
- ✅ Sem breaking changes para clientes


\c postgres
UPDATE pg_database SET datistemplate = FALSE WHERE datname = 'template1';
DROP DATABASE template1;
CREATE DATABASE template1 WITH TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';
UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template1';
