# 📡 InfraWatch – Backend

> Sistema completo para monitoramento de infraestrutura, com coleta de métricas, alertas em tempo real, análise de SLA e previsão com IA.

---

## Instakar dependencias

```bash
$ npm install
```

## compilar e rodar o projecto

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## ⚙️ Fluxo Geral do Sistema

```jsx
Usuário
	│
	▼
Frontend (React/Next.js)
	│
	▼ [HTTP/API ou GraphQL]
Backend (Node.js/NestJS)
	├── Monitoramento Engine
	│     ├─ Ping
	│     ├─ SNMP
	│     ├─ Webhook
	│     └─ API externa
	├── SLA e Análise
	│     ├─ Cálculo de SLA
	│     └─ Histórico de falhas
	├── Sistema de Alertas
	│     └─ Notificações (email, Telegram, Slack)
	└── API (REST ou GraphQL)
	▲
	│
Banco de Dados
	├── PostgreSQL (usuários, serviços, alertas)
	└── TimescaleDB (métricas e logs históricos)

InfraWatch/
├── frontend/                   # Aplicação React
├── backend/                    # API NestJS
├── docs/                       # Documentação técnica
├── docker-compose.yml          # Orquestração dos serviços
├── README.md                   # Introdução e visão geral
└── .gitignore
/backend
├── src/
│   ├── app.module.ts
│
│   ├── monitors/
│   │   ├── monitors.module.ts
│   │   ├── monitors.service.ts
│   │   ├── ping.service.ts
│   │   ├── snmp.service.ts
│   │   └── webhook.service.ts
│
│   ├── services/
│   │   ├── services.module.ts
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   └── service.entity.ts
│
│   ├── sla/
│   │   ├── sla.module.ts
│   │   ├── sla.service.ts
│   │   └── sla.controller.ts
│
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── telegram.service.ts
│   │   ├── email.service.ts
│   │   └── slack.service.ts
│
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   └── predictor.service.ts
│
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── user.entity.ts
│
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.providers.ts
│
│   └── main.ts
├── .env
├── tsconfig.json
└── package.json
```

📊 Módulo metrics
Responsável por:

Validar token JWT

Armazenar métricas no TimescaleDB

Acionar monitoramento, IA e notificações

📡 Módulo monitors
Detecta quedas e falhas

Avalia limiares de latência

Classifica severidade do evento

Emite alertas

🔔 Módulo notifications
Envia alertas por e-mail, Telegram, Slack, etc.

Aplica escalonamento

Registra logs de notificação

📈 Módulo sla
Calcula SLA com base nas falhas

Exibe gráficos e relatórios

Histórico mensal/semanal

🧠 Módulo ai
Detecta anomalias com base em padrões históricos

Previsão de falhas

Classificação de falhas

Sugestões automáticas (se aplicável)

🔐 Módulo users
Autenticação e permissões

Gerenciamento de operadores/admins

Logs de auditoria

🛠️ Módulo services
Cadastro e controle de serviços monitorados

Configuração de limiares

Associação com agentes

🕵️ Agente (Go)
🏓 1. Coleta de Latência (Ping)
Testa conectividade com ICMP

Mede latência com múltiplos alvos

🧠 2. Monitoramento do Sistema
Usa gopsutil para coletar:
```
  CPU
  RAM
  Disco
  Uptime
```

📜 3. Logs do Sistema
Detecta eventos críticos no SO

Ex: falhas, erros, crashs

🧩 4. Detecção de Falhas Locais
Processos finalizados com erro

Exit codes anormais

🧾 5. Histórico (opcional)
Lê comandos recentes

Para auditoria e investigação

🔁 Frequência
A cada N segundos (config.yaml)

📤 Envio de Dados
Envia via POST /metrics com token JWT:
```json
{
  "host": "srv-erp-prod",
  "timestamp": "2025-08-05T16:00:00Z",
  "metrics": {
    "cpu": 83.4,
    "memory": 91.2,
    "disk": 88.5,
    "uptime_seconds": 1298432,
    "network": {
      "bytes_sent": 502348000,
      "bytes_recv": 1048329000
    }
  },
  "latency": {
    "8.8.8.8": 142.7,
    "192.168.1.1": 1.2,
    "10.10.10.2": 15.9
  },
  "logs": [
    "systemd[1]: nginx.service failed with exit code 1",
    "kernel: eth0: link is down",
    "systemd[1]: Started PostgreSQL database server.",
    "CRON[7284]: (root) CMD (/usr/local/bin/backup.sh)",
    "sshd[13423]: Failed password for invalid user admin from 185.212.44.11 port 50322 ssh2"
  ],
  "alerts": [
    {
      "type": "process_crash",
      "description": "nginx exited with status 1"
    },
    {
      "type": "high_cpu",
      "description": "CPU usage exceeded 80% threshold (current: 83.4%)"
    },
    {
      "type": "high_memory",
      "description": "Memory usage exceeded 90% (current: 91.2%)"
    }
  ]
}
```

