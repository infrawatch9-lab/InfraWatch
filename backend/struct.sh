#!/bin/bash

mkdir -p backend/src/{monitors,services,sla,notifications,ai,users,database}

# Arquivos principais
touch backend/src/app.module.ts
touch backend/src/main.ts
touch backend/.env
touch backend/tsconfig.json
touch backend/package.json

# Monitors
touch backend/src/monitors/{monitors.module.ts,monitors.service.ts,ping.service.ts,snmp.service.ts,webhook.service.ts}

# Services
touch backend/src/services/{services.module.ts,services.controller.ts,services.service.ts,service.entity.ts}

# SLA
touch backend/src/sla/{sla.module.ts,sla.service.ts,sla.controller.ts}

# Notifications
touch backend/src/notifications/{notifications.module.ts,telegram.service.ts,email.service.ts,slack.service.ts}

# AI
touch backend/src/ai/{ai.module.ts,ai.service.ts,predictor.service.ts}

# Users
touch backend/src/users/{users.module.ts,users.service.ts,users.controller.ts,user.entity.ts}

# Database
touch backend/src/database/{database.module.ts,database.providers.ts}

echo "✅ Estrutura criada com sucesso!"
