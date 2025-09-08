# 📡 InfraWatch - Backend

Backend do **InfraWatch**, uma plataforma de monitoramento de
infraestrutura em tempo real, com suporte a múltiplos protocolos,
alertas inteligentes e relatórios de SLA.

------------------------------------------------------------------------

## 🚀 Tecnologias Utilizadas

-   **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
-   **Banco de Dados**: PostgreSQL com [Prisma ORM](https://www.prisma.io/)
-   **Autenticação**: JWT + Guards baseados em Roles
-   **Comunicação em Tempo Real**: Socket.io
-   **Documentação de API**: Swagger
-   **Outros**:
    -   bcrypt (hash de senhas)
    -   nodemailer (e-mails)
    -   Puppeteer (PDF)
    -   json2csv (relatórios CSV)
    -   Axios, ping

------------------------------------------------------------------------

## 📦 Módulos Principais

### 🔍 1. Serviços de Monitoramento

Suporte a 4 tipos de monitoramento:
- 🏓 **PING**: Verificação de conectividade de rede
- 🌐 **HTTP/HTTPS**: Monitoramento de endpoints e APIs
- 📡 **SNMP**: Dispositivos de rede
- 🔗 **WEBHOOK**: Notificações externas

### 🚨 2. Sistema de Alertas

-   Regras configuráveis por serviço
-   Múltiplos canais de notificação:
    -   📧 Email (Gmail)
    -   💬 Slack
    -   📱 Telegram
-   Níveis de severidade: `INFO`, `WARNING`, `CRITICAL`

### 👥 3. Gestão de Usuários e Teams

-   Autenticação via JWT
-   Controle de acesso baseado em roles (`ADMIN`, `USER`)
-   Estrutura em **teams**
-   Notificações por usuário/serviço

### 📊 4. SLA e Relatórios

-   Cálculo de SLA por serviço
-   Relatórios em PDF
-   Métricas históricas

### 📈 5. Dashboard e Visualização

-   Interface em tempo real via WebSockets
-   Métricas de CPU, memória e latência
-   Status dos serviços monitorados

------------------------------------------------------------------------

## 🗄️ Modelo de Dados

Entidades principais: - **User** → Usuários do sistema
- **Team** → Organização de usuários
- **Service** → Serviços monitorados
- **MonitoringConfig** → Configurações de monitoramento
- **Alert / AlertRule** → Sistema de alertas
- **Metric** → Métricas coletadas
- **SLA** → Acordos de Nível de Serviço
- **Notification** → Configurações de notificação

------------------------------------------------------------------------

## 🔌 APIs Disponíveis

  Endpoint            Descrição
  ------------------- --------------------------
  `/api/services`     CRUD de serviços
  `/api/ping`         Monitoramento PING
  `/api/http`         Monitoramento HTTP/HTTPS
  `/api/snmp`         Monitoramento SNMP
  `/api/webhook`      Webhooks externos
  `/api/users`        Gestão de usuários
  `/api/alerts`       Sistema de alertas
  `/api/metrics`      Métricas coletadas
  `/api/sla`          Relatórios SLA
  `/api/dashboards`   Dashboards em tempo real

------------------------------------------------------------------------

## 📊 Funcionalidades

✅ Monitoramento multi-protocolo
✅ Alertas inteligentes com múltiplos canais
✅ Dashboards em tempo real
✅ Relatórios de SLA em PDF
✅ Gestão de equipes e permissões
✅ APIs RESTful completas
✅ Comunicação via WebSockets
✅ Containerização com Docker

------------------------------------------------------------------------

## 📁 Estrutura Modular

-   Cada tipo de serviço possui **módulo dedicado**
-   Separação entre **controladores**, **serviços** e **entidades**
-   Guards e decorators para autenticação
-   Configuração centralizada com Prisma

------------------------------------------------------------------------

## 🚀 Como Executar

### Ambiente de Desenvolvimento

``` bash
npm run dev
```

### Produção

``` bash
npm run build && npm start
```

### Testes

``` bash
npm run test
```

------------------------------------------------------------------------

## 🔧 Pontos de Melhoria

-   🤖 **Módulo AI**: Implementação de recursos de inteligência artificial
-   🧪 **Cobertura de Testes**: Ampliar testes unitários e de integração
-   📚 **Documentação**: Expandir documentação técnica e exemplos de uso

------------------------------------------------------------------------

📌 Desenvolvido para monitoramento **moderno, modular e escalável**.