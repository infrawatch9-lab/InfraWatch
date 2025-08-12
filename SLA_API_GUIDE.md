# InfraWatch API - Guia SLA

**Monitoramento e Análise de SLA**

## 📋 Base URL

```
http://localhost:3042/api/sla
```

## 🔐 Autenticação

```javascript
// Todas as rotas requerem autenticação
headers: {
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

---

## 👤 DTOs (Request/Response)

### SLADto (Request)

```typescript
{
  serviceId: number;        // obrigatório
  periodStart: string;      // obrigatório (ISO date)
  periodEnd: string;        // obrigatório (ISO date)
  targetUptime?: number;    // opcional (ex: 99.9)
}
```

### SLAResponseDto

```typescript
{
  id: number;
  serviceId: number;
  periodStart: string;
  periodEnd: string;
  uptimePct: number;        // Porcentagem de uptime
  downtime: number;         // Em minutos
  status: "OK" | "VIOLATED" | "UNKNOWN";
  service?: {
    id: number;
    name: string;
    type: string;
  };
}
```

### SLAReportDto

```typescript
{
  serviceId: number;
  serviceName: string;
  period: {
    start: string;
    end: string;
  };
  sla: {
    target: number;         // Meta de SLA (ex: 99.9)
    achieved: number;       // SLA alcançado
    status: "OK" | "VIOLATED" | "UNKNOWN";
  };
  availability: {
    totalTime: number;      // Tempo total em minutos
    uptime: number;         // Uptime em minutos
    downtime: number;       // Downtime em minutos
  };
  incidents: IncidentDto[];
  metrics: {
    mttr: number;          // Mean Time To Recovery (minutos)
    mtbf: number;          // Mean Time Between Failures (minutos)
    incidentCount: number;
  };
}
```

### IncidentDto

```typescript
{
  id: number;
  startTime: string;
  endTime?: string;
  duration: number;         // Em minutos
  severity: string;
  message: string;
  resolved: boolean;
}
```

### SLASummaryDto

```typescript
{
  serviceId: number;
  serviceName: string;
  currentMonth: {
    uptimePct: number;
    status: "OK" | "VIOLATED" | "UNKNOWN";
    downtime: number;
  }
  last30Days: {
    uptimePct: number;
    status: "OK" | "VIOLATED" | "UNKNOWN";
    downtime: number;
  }
  last7Days: {
    uptimePct: number;
    status: "OK" | "VIOLATED" | "UNKNOWN";
    downtime: number;
  }
}
```

### SLATrendDto

```typescript
{
  date: string;
  uptimePct: number;
  downtime: number;
  incidentCount: number;
}
```

---

## 🛠️ Rotas da API

### 🧮 Calcular SLA

```http
POST /sla/calculate
Authorization: Bearer <token>
```

**Request:**

```json
{
  "serviceId": 1,
  "periodStart": "2025-08-01T00:00:00.000Z",
  "periodEnd": "2025-08-12T23:59:59.999Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "serviceId": 1,
    "periodStart": "2025-08-01T00:00:00.000Z",
    "periodEnd": "2025-08-12T23:59:59.999Z",
    "totalMinutes": 17280,
    "downtimeMinutes": 45,
    "uptimePct": 99.74,
    "status": "OK",
    "incidents": [
      {
        "id": 123,
        "startTime": "2025-08-05T14:30:00.000Z",
        "endTime": "2025-08-05T15:15:00.000Z",
        "duration": 45,
        "severity": "CRITICAL",
        "message": "Serviço indisponível - timeout",
        "resolved": true
      }
    ]
  }
}
```

### 💾 Salvar SLA (Admin apenas)

```http
POST /sla/save
Authorization: Bearer <token>
```

**Request:**

```json
{
  "serviceId": 1,
  "periodStart": "2025-08-01T00:00:00.000Z",
  "periodEnd": "2025-08-12T23:59:59.999Z"
}
```

### 📊 SLA por Serviço

```http
GET /sla/service/:serviceId?limit=10
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "serviceId": 1,
      "periodStart": "2025-08-11T00:00:00.000Z",
      "periodEnd": "2025-08-12T00:00:00.000Z",
      "uptimePct": 99.95,
      "downtime": 7,
      "status": "OK",
      "service": {
        "id": 1,
        "name": "API Principal",
        "type": "API"
      }
    }
  ]
}
```

### 📈 Relatório Detalhado de SLA

```http
GET /sla/report/:serviceId?periodStart=2025-08-01T00:00:00.000Z&periodEnd=2025-08-12T23:59:59.999Z
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "serviceId": 1,
    "serviceName": "API Principal",
    "period": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-12T23:59:59.999Z"
    },
    "sla": {
      "target": 99.9,
      "achieved": 99.74,
      "status": "VIOLATED"
    },
    "availability": {
      "totalTime": 17280,
      "uptime": 17235,
      "downtime": 45
    },
    "incidents": [...],
    "metrics": {
      "mttr": 45.0,
      "mtbf": 8640.0,
      "incidentCount": 1
    }
  }
}
```

### 📋 Resumo de SLA

```http
GET /sla/summary/:serviceId
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "serviceId": 1,
    "serviceName": "API Principal",
    "currentMonth": {
      "uptimePct": 99.85,
      "status": "OK",
      "downtime": 108
    },
    "last30Days": {
      "uptimePct": 99.92,
      "status": "OK",
      "downtime": 35
    },
    "last7Days": {
      "uptimePct": 100.0,
      "status": "OK",
      "downtime": 0
    }
  }
}
```

### 📈 Tendência de SLA

```http
GET /sla/trend/:serviceId?days=30
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-07-13T00:00:00.000Z",
      "uptimePct": 100.0,
      "downtime": 0,
      "incidentCount": 0
    },
    {
      "date": "2025-07-14T00:00:00.000Z",
      "uptimePct": 98.5,
      "downtime": 22,
      "incidentCount": 1
    }
  ]
}
```

### 📊 Resumo de Todos os Serviços

```http
GET /sla/summary
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "serviceId": 1,
      "serviceName": "API Principal",
      "currentMonth": { ... },
      "last30Days": { ... },
      "last7Days": { ... }
    }
  ],
  "count": 5
}
```

### ⚙️ Processamento Automático (Admin apenas)

```http
POST /sla/process-automatic
Authorization: Bearer <token>
```

### 📅 Rotas de Conveniência

#### SLA de Hoje

```http
GET /sla/today/:serviceId
Authorization: Bearer <token>
```

#### SLA do Mês Atual

```http
GET /sla/current-month/:serviceId
Authorization: Bearer <token>
```

#### SLA da Última Semana

```http
GET /sla/last-week/:serviceId
Authorization: Bearer <token>
```

---

## 💡 Exemplos de Uso JavaScript

### Calcular SLA

```javascript
const calculateSLA = async (serviceId, periodStart, periodEnd) => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch("http://localhost:3042/api/sla/calculate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      periodStart,
      periodEnd,
    }),
  });

  return response.json();
};
```

### Buscar Resumo de SLA

```javascript
const getSLASummary = async (serviceId) => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `http://localhost:3042/api/sla/summary/${serviceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
};
```

### Buscar Relatório Detalhado

```javascript
const getSLAReport = async (serviceId, periodStart, periodEnd) => {
  const token = localStorage.getItem("accessToken");
  const params = new URLSearchParams({
    periodStart,
    periodEnd,
  });

  const response = await fetch(
    `http://localhost:3042/api/sla/report/${serviceId}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
};
```

### Buscar Tendência

```javascript
const getSLATrend = async (serviceId, days = 30) => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `http://localhost:3042/api/sla/trend/${serviceId}?days=${days}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
};
```

---

## 🧪 Dados para Testes

### Cálculo de SLA

```json
{
  "serviceId": 1,
  "periodStart": "2025-08-01T00:00:00.000Z",
  "periodEnd": "2025-08-12T23:59:59.999Z"
}
```

### Período da Última Semana

```javascript
const now = new Date();
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const slaData = {
  serviceId: 1,
  periodStart: lastWeek.toISOString(),
  periodEnd: now.toISOString(),
};
```

### Período do Mês Atual

```javascript
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

const slaData = {
  serviceId: 1,
  periodStart: monthStart.toISOString(),
  periodEnd: now.toISOString(),
};
```

---

## 📝 Notas Importantes

- **Cálculo Automático**: SLA é calculado automaticamente para o dia anterior
- **Status**: `OK` (>99%), `VIOLATED` (<99%), `UNKNOWN` (dados insuficientes)
- **Downtime**: Medido em minutos baseado em alertas críticos não resolvidos
- **MTTR**: Tempo médio para resolver incidentes
- **MTBF**: Tempo médio entre falhas
- **Tendência**: Máximo 365 dias de histórico
- **Permissões**: ADMIN pode salvar/processar, USER pode visualizar

---

## 🎯 Métricas de SLA

| Métrica       | Descrição                    | Unidade |
| ------------- | ---------------------------- | ------- |
| **Uptime %**  | Porcentagem de tempo online  | %       |
| **Downtime**  | Tempo offline total          | minutos |
| **MTTR**      | Tempo médio para recuperação | minutos |
| **MTBF**      | Tempo médio entre falhas     | minutos |
| **Incidents** | Número total de incidentes   | count   |

---

## 🚨 Status de SLA

| Status       | Critério            | Cor Sugerida |
| ------------ | ------------------- | ------------ |
| **OK**       | Uptime ≥ 99%        | 🟢 Verde     |
| **VIOLATED** | Uptime < 99%        | 🔴 Vermelho  |
| **UNKNOWN**  | Dados insuficientes | 🟡 Amarelo   |
