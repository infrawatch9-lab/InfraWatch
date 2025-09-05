# InfluxDB Integration - InfraWatch

## Visão Geral

Esta implementação adiciona suporte ao InfluxDB como banco de dados especializado em séries temporais para otimizar o armazenamento e consulta de métricas de monitoramento, mantendo o PostgreSQL para dados relacionais.

## Arquitetura Híbrida

### PostgreSQL (Existente)
- **Uso**: Dados relacionais (serviços, usuários, configurações, alertas)
- **Modelo**: Relacional com Prisma ORM
- **Forte em**: Transações ACID, relacionamentos complexos, relatórios SLA

### InfluxDB (Novo)
- **Uso**: Métricas de séries temporais (CPU, memória, latência, rede)
- **Modelo**: Time-series com tags e fields
- **Forte em**: Consultas temporais, agregações, alta frequência de escrita

## Configuração

### 1. Instalar InfluxDB

```bash
# Docker (Recomendado)
docker run -d \
  --name influxdb \
  -p 8086:8086 \
  -v influxdb-data:/var/lib/influxdb2 \
  influxdb:2.7

# Ou usando Docker Compose
version: '3.8'
services:
  influxdb:
    image: influxdb:2.7
    container_name: influxdb
    ports:
      - "8086:8086"
    volumes:
      - influxdb-data:/var/lib/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=password123
      - DOCKER_INFLUXDB_INIT_ORG=infrawatch
      - DOCKER_INFLUXDB_INIT_BUCKET=metrics

volumes:
  influxdb-data:
```

### 2. Configurar Variáveis de Ambiente

Atualize seu arquivo `.env` ou `ssss`:

```env
# InfluxDB Configuration
INFLUXDB_URL="http://localhost:8086"
INFLUXDB_TOKEN="your-influxdb-token-here"
INFLUXDB_ORG="infrawatch"
INFLUXDB_BUCKET="metrics"
```

### 3. Obter Token de Acesso

1. Acesse `http://localhost:8086`
2. Login com as credenciais configuradas
3. Vá em **Data** > **Tokens**
4. Gere um novo token com permissões de leitura/escrita
5. Atualize `INFLUXDB_TOKEN` no arquivo de ambiente

## Funcionalidades Implementadas

### Dual-Write Strategy

O sistema agora escreve métricas tanto no PostgreSQL quanto no InfluxDB:

```typescript
// Automático em saveMetrics()
await metricsService.saveMetrics({
  serviceId: 1,
  timestamp: new Date(),
  metrics: {
    cpu: 75.5,
    memory: 82.3,
    disk: 65.0
  },
  latency: { "8.8.8.8": 45.2 }
});

// Salva em ambos os bancos automaticamente
```

### Novos Endpoints da API

#### 1. Métricas em Tempo Real
```http
GET /metrics/realtime/:serviceId?timeRange=1h
```

#### 2. Análise de Latência
```http
GET /metrics/latency/:serviceId?timeRange=6h
```

#### 3. Métricas Agregadas
```http
GET /metrics/aggregated/:serviceId?timeRange=24h&window=15m
```

#### 4. Status do InfluxDB
```http
GET /metrics/health/influxdb
```

### Estrutura de Dados no InfluxDB

#### Measurement: `system_metrics`
```
Tags:
  - service_id: "123"
  - host: "srv-prod-01"
  - status: "ACTIVE"

Fields:
  - cpu: 75.5
  - memory: 82.3
  - disk: 65.0
  - network_in: 1024000
  - network_out: 512000

Timestamp: 2025-09-05T14:30:00Z
```

#### Measurement: `network_latency`
```
Tags:
  - service_id: "123"
  - host: "srv-prod-01"
  - target: "8.8.8.8"

Fields:
  - response_time_ms: 45.2

Timestamp: 2025-09-05T14:30:00Z
```

## Queries de Exemplo

### 1. CPU médio nas últimas 2 horas
```flux
from(bucket: "metrics")
  |> range(start: -2h)
  |> filter(fn: (r) => r._measurement == "system_metrics")
  |> filter(fn: (r) => r.service_id == "123")
  |> filter(fn: (r) => r._field == "cpu")
  |> aggregateWindow(every: 5m, fn: mean)
```

### 2. Latência máxima por dia
```flux
from(bucket: "metrics")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "network_latency")
  |> filter(fn: (r) => r.service_id == "123")
  |> aggregateWindow(every: 1d, fn: max)
```

### 3. Trending de memória
```flux
from(bucket: "metrics")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "system_metrics")
  |> filter(fn: (r) => r._field == "memory")
  |> aggregateWindow(every: 1h, fn: mean)
  |> derivative(unit: 1h)
```

## Integração com SLA Service

O SLA Service pode agora usar dados do InfluxDB para cálculos mais precisos:

```typescript
// Em desenvolvimento futuro
const influxMetrics = await metricsService.getAggregatedMetrics(
  serviceId, 
  '24h', 
  '15m'
);

// Calcular disponibilidade baseado em dados agregados
const availability = calculateAvailabilityFromInflux(influxMetrics);
```

## Benefícios

### Performance
- **10x mais rápido** para consultas de séries temporais
- **Compressão automática** reduz uso de storage
- **Consultas paralelas** para múltiplos serviços

### Escalabilidade
- **Milhões de pontos por segundo**
- **Retenção automática** de dados antigos
- **Clustering** para alta disponibilidade

### Análise Avançada
- **Agregações temporais** (médias, máximos, tendências)
- **Downsampling** automático
- **Alertas baseados em thresholds**

## Monitoramento

### Verificar Status
```bash
curl http://localhost:3000/metrics/health/influxdb
```

### Logs do Sistema
```bash
# Verificar conexão InfluxDB
docker logs backend | grep "InfluxDB"

# Output esperado:
# ✅ InfluxDB connected: http://localhost:8086
# 📊 Metrics written to InfluxDB for service 123
```

## Fallback e Resiliência

O sistema implementa **graceful degradation**:

1. **InfluxDB indisponível**: Continua funcionando só com PostgreSQL
2. **Falha na escrita**: Log de warning, não interrompe operação
3. **Consultas falham**: Fallback automático para PostgreSQL

## Próximos Passos

1. **Dashboards** com Grafana conectado ao InfluxDB
2. **Alertas** baseados em queries do InfluxDB
3. **Migração** de dados históricos do PostgreSQL
4. **Retention policies** para otimizar storage
5. **Clustering** InfluxDB para alta disponibilidade

## Troubleshooting

### Erro de Conexão
```
❌ Failed to initialize InfluxDB: connect ECONNREFUSED 127.0.0.1:8086
```
**Solução**: Verificar se InfluxDB está rodando na porta 8086

### Token Inválido
```
❌ Error writing metrics to InfluxDB: unauthorized access
```
**Solução**: Verificar `INFLUXDB_TOKEN` no arquivo de ambiente

### Bucket Não Existe
```
❌ Error writing metrics to InfluxDB: bucket "metrics" not found
```
**Solução**: Criar bucket "metrics" na interface do InfluxDB ou via CLI

---

**Implementado por**: GitHub Copilot  
**Data**: Setembro 2025  
**Versão**: 1.0.0
