# Notifications Manager - Estrutura Refatorada

## Visão Geral

O sistema de notificações foi refatorado para melhorar a organização, manutenibilidade e testabilidade do código. A lógica foi separada em classes utilitárias especializadas.

## Estrutura de Arquivos

```
src/notifications/
├── notifications-manager.controller.ts    # Controller principal (refatorado)
├── notifications-manager.service.ts       # Service principal
├── utils/
│   ├── index.ts                           # Arquivo de barril
│   ├── message-parser.util.ts             # Parser de mensagens de webhook
│   ├── event-detector.util.ts             # Detector de tipos de eventos
│   ├── webhook-processor.util.ts          # Processador de webhooks
│   └── alert-notification-sender.util.ts  # Enviador de notificações
└── ... (outros arquivos)
```

## Classes Utilitárias

### 1. MessageParserUtil

**Responsabilidade**: Extrair dados estruturados das mensagens de webhook do CheckCle.

**Funcionalidades**:
- Parse do formato tokenizado: `INFO|API Gateway Service_20_HTTP|UP|HTTP|248ms|2025-09-07 17:02:50`
- Fallback para formatos legados
- Extração de: serviceName, serviceId, serviceType, status, responseTime, incidentType, timestamp

**Exemplo de uso**:
```typescript
const data = MessageParserUtil.extractServiceData(webhookMessage);
console.log(data.serviceName, data.serviceId, data.status);
```

### 2. EventDetectorUtil

**Responsabilidade**: Determinar o tipo de evento baseado na mensagem e dados extraídos.

**Tipos de eventos suportados**: `ALERT`, `RESOLVED`, `WARNING`, `MAINTENANCE`, `INCIDENT`, `INFO`

**Funcionalidades**:
- Mapeamento de tipos de incidente para eventos
- Fallback baseado em análise de texto
- Lógica de status para eventos INFO

**Exemplo de uso**:
```typescript
const event = EventDetectorUtil.detectEventType(message, messageData);
// Retorna: 'ALERT', 'RESOLVED', etc.
```

### 3. WebhookProcessorUtil

**Responsabilidade**: Processar payloads completos de webhook do CheckCle.

**Funcionalidades**:
- Validação de dados extraídos
- Busca de informações do serviço no banco
- Atualização de status do serviço
- Montagem da resposta padronizada (ProcessedAlert)

**Exemplo de uso**:
```typescript
const processor = new WebhookProcessorUtil(notificationsService);
const processedAlert = await processor.processWebhookPayload(payload);
```

### 4. AlertNotificationSender

**Responsabilidade**: Enviar notificações de alerta para usuários.

**Funcionalidades**:
- Salvamento de notificações na base de dados
- Envio de emails com templates dinâmicos
- Sistema de fallback para envio simples
- Montagem de variáveis para templates

**Exemplo de uso**:
```typescript
const sender = new AlertNotificationSender(notificationsService);
await sender.sendAlertNotifications(processedAlert);
```

## Fluxo de Processamento

1. **Webhook recebido** → `NotificationsManagerController.processCheckcleWebhook()`
2. **Processamento** → `WebhookProcessorUtil.processWebhookPayload()`
   - Parse da mensagem → `MessageParserUtil.extractServiceData()`
   - Detecção de evento → `EventDetectorUtil.detectEventType()`
   - Validação e busca no banco
   - Atualização de status do serviço
3. **Envio de notificações** → `AlertNotificationSender.sendAlertNotifications()`
   - Salvamento na base de dados
   - Envio de emails com templates

## Benefícios da Refatoração

### 1. **Separação de Responsabilidades**
- Cada classe tem uma responsabilidade específica
- Facilita manutenção e testing

### 2. **Reutilização**
- Classes podem ser utilizadas em outros contextos
- Lógica centralizada e consistente

### 3. **Testabilidade**
- Cada classe pode ser testada independentemente
- Mocks mais simples e específicos

### 4. **Legibilidade**
- Controller mais limpo e focado na coordenação
- Lógica complexa isolada em classes específicas

### 5. **Manutenibilidade**
- Mudanças em parsing não afetam envio de emails
- Fácil adição de novos formatos de mensagem
- Sistema modular e extensível

## Compatibilidade

- ✅ **Formato tokenizado**: `INFO|Service_ID_Type|Status|Type|ResponseTime|Timestamp`
- ✅ **Formatos legados**: Mantém compatibilidade com formatos antigos
- ✅ **Templates dinâmicos**: Sistema de seleção automática de templates
- ✅ **Fallback**: Sistema robusto de fallback para situações de erro

## Próximos Passos

1. **Testes unitários**: Criar testes para cada classe utilitária
2. **Documentação API**: Atualizar documentação Swagger
3. **Métricas**: Adicionar logging e métricas de performance
4. **Validação**: Implementar validação mais rigorosa dos payloads
