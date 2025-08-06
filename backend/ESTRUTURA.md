# InfraWatch - Backend API

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── users/                    # 🔐 Módulo de Autenticação e Usuários
│   │   ├── user.entity.ts       # Entidades e DTOs TypeScript
│   │   ├── jwt.service.ts       # Serviço JWT (geração/validação tokens)
│   │   ├── email.service.ts     # Serviço de email (simulação)
│   │   ├── users.service.ts     # Lógica de negócio (CRUD + Auth)
│   │   ├── users.controller.ts  # Controllers REST API
│   │   └── users.module.ts      # Módulo Express Router
│   ├── ai/                      # 🤖 Módulo IA
│   ├── database/               # 🗄️ Configurações de Banco de Dados
│   ├── monitors/               # 📊 Módulo de Monitoramento
│   ├── notifications/          # 📧 Módulo de Notificações
│   ├── services/               # 🔧 Módulo de Serviços
│   ├── sla/                    # 📈 Módulo SLA
│   ├── app.module.ts           # 🚀 Configuração principal do Express
│   ├── app.routes.ts           # 🛣️ Roteador principal da API
│   └── main.ts                 # 🎯 Ponto de entrada do servidor
├── prisma/
│   ├── schema.prisma           # 📋 Schema do banco de dados
│   └── timescaledb-setup.sql   # ⏰ Configuração TimescaleDB
├── dist/                       # 📦 Arquivos compilados (JavaScript)
├── package.json               # 📝 Dependências e scripts npm
└── tsconfig.json              # ⚙️ Configuração TypeScript
```

## 🌐 API REST - Rotas Disponíveis

### **Base URL:** `http://localhost:3000/api`

### 🏥 **Health Check**

```http
GET /api/health
```

**Resposta:**

```json
{
  "success": true,
  "message": "InfraWatch API is running",
  "timestamp": "2025-08-06T01:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 👥 **Rotas de Usuários**

#### 🔓 **Rotas Públicas (sem autenticação)**

##### **1. Registrar Usuário**

```http
POST /api/users/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

##### **2. Registrar com Senha Provisória** 🆕

```http
POST /api/users/register-temp
Content-Type: application/json

{
  "name": "Maria Silva",
  "email": "maria@email.com"
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Conta criada com sucesso! Verifique seu email para a senha provisória.",
  "user": {
    "id": 5,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "USER",
    "isTemporaryPassword": true,
    "temporaryPasswordExpiry": "2025-08-07T01:47:22.646Z"
  }
}
```

**📧 Email Simulado (check server logs):**

```
🎯 ===== INFRAWATCH - CREDENCIAIS PROVISÓRIAS =====

Olá Maria Silva!

Sua conta foi criada com sucesso. Use as credenciais abaixo para fazer seu primeiro login:

📧 Email: maria@email.com
🔑 Senha Provisória: ABC123DEF

⚠️  IMPORTANTE:
- Esta senha expira em 24 horas
- Você DEVE alterar sua senha no primeiro login
- Acesse: http://localhost:3000/api/users/reset-password

=====================================
```

##### **3. Login**

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "senha123"
}
```

##### **4. Renovar Token**

```http
POST /api/users/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 🔒 **Rotas Protegidas (requerem token)**

##### **5. Perfil do Usuário Logado**

```http
GET /api/users/profile
Authorization: Bearer <accessToken>
```

##### **6. Redefinir Senha** 🆕

```http
PUT /api/users/reset-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "senha_provisoria_ou_atual",
  "newPassword": "minha_nova_senha_123"
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Senha alterada com sucesso!"
}
```

**📧 Email de Confirmação (simulado):**

```
🎯 ===== INFRAWATCH - SENHA ALTERADA =====

Olá Maria Silva!

Sua senha foi alterada com sucesso em 06/08/2025 às 01:47:22.

🔐 Sua conta agora está totalmente configurada!
🌐 Acesse o sistema: http://localhost:3000

Se você não fez esta alteração, entre em contato conosco imediatamente.

=====================================
```

##### **7. Buscar Usuário por ID**

```http
GET /api/users/{id}
Authorization: Bearer <accessToken>
```

#### 🔐 **Rotas Administrativas (requerem token + role ADMIN)**

##### **8. Listar Todos os Usuários**

```http
GET /api/users/
Authorization: Bearer <accessToken>
```

##### **9. Criar Usuário (Admin)**

```http
POST /api/users/
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Maria Admin",
  "email": "maria@empresa.com",
  "password": "senha456",
  "role": "ADMIN"
}
```

---

## 🔑 **Sistema de Autenticação**

### **JWT Tokens**

- **Access Token:** Expira em 24 horas
- **Refresh Token:** Expira em 7 dias
- **Header:** `Authorization: Bearer <token>`

### **Roles de Usuário**

- **USER:** Usuário comum (padrão)
- **ADMIN:** Administrador com permissões especiais

### **🆕 Sistema de Senhas Provisórias**

#### **Fluxo de Registro com Senha Provisória:**

1. **Administrador registra usuário** (`POST /api/users/register-temp`)
2. **Sistema gera senha provisória** (6-8 caracteres alfanuméricos)
3. **Email simulado é enviado** (visível nos logs do servidor)
4. **Usuário faz login** com credenciais provisórias
5. **Sistema força redefinição** de senha no primeiro acesso
6. **Confirmação por email** após alteração da senha

#### **Características das Senhas Provisórias:**

- ⏰ **Expiração:** 24 horas
- 🔒 **Obrigatória redefinição:** Primeiro login
- 📧 **Notificação:** Email simulado com credenciais
- 🔐 **Segurança:** Hash bcrypt mesmo para senhas temporárias

#### **Validações de Segurança:**

- Senha provisória expira automaticamente
- Token JWT inválido após expiração da senha provisória
- Verificação de integridade em todas as operações
- Logs de auditoria para todas as alterações de senha

### **Middleware de Autenticação**

```typescript
// Protege rotas que requerem login
authenticateToken(req, res, next);

// Protege rotas que requerem admin
requireAdmin(req, res, next);
```

---

## 📊 **Banco de Dados**

### **Prisma ORM + PostgreSQL + TimescaleDB**

- ✅ Schema definido em `prisma/schema.prisma`
- ✅ Hypertables configuradas para métricas
- ✅ Compressão automática após 7 dias
- ✅ Retenção de dados por 1 ano

### **Tabelas Principais**

- `users` - Usuários e autenticação (inclui campos de senha provisória)
- `services` - Serviços monitorados
- `metrics` - Métricas de performance (otimizada com índices)
- `alerts` - Alertas do sistema
- `system_logs` - Logs do sistema (otimizada com índices)

#### **🆕 Schema do User (com senha provisória):**

```prisma
model User {
  id                       Int       @id @default(autoincrement())
  name                     String
  email                    String    @unique
  passwordHash             String
  role                     Role      @default(USER)
  isTemporaryPassword      Boolean   @default(false)
  temporaryPasswordExpiry  DateTime?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
}
```

---

## � **Como Executar**

### **1. Instalar Dependências**

```bash
npm install
```

### **2. Configurar Banco de Dados**

```bash
# Aplicar schema Prisma
npx prisma db push

# Executar configuração TimescaleDB
psql -d sua_database -f prisma/timescaledb-setup.sql
```

### **3. Executar Servidor**

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### **4. Testar API**

```bash
# Health check
curl http://localhost:3000/api/health

# Registrar usuário comum
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@email.com", "password": "123456"}'

# 🆕 Registrar com senha provisória
curl -X POST http://localhost:3000/api/users/register-temp \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria Silva", "email": "maria@test.com"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@test.com", "password": "SENHA_PROVISORIA_DO_LOG"}'

# 🆕 Redefinir senha (usar token do login)
curl -X PUT http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_JWT" \
  -d '{"currentPassword": "senha_provisoria", "newPassword": "nova_senha_123"}'
```

---

## 🔧 **Tecnologias Utilizadas**

- **Node.js** + **TypeScript**
- **Express.js** (API REST)
- **Prisma ORM** (Database)
- **PostgreSQL** (Neon.tech cloud)
- **JWT** (Autenticação)
- **bcrypt** (Hash de senhas)
- **🆕 Email Service** (Simulação de envio)
- **Arquitetura modular** (inspirada no NestJS)

---

## 📝 **Scripts NPM**

```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/main.ts",
  "build": "tsc",
  "start": "node dist/main.js"
}
```

---

## 🆕 **Novidades da Versão Atual**

### **✅ Sistema de Senha Provisória Implementado**

- **Registro automático** com senha temporária
- **Email simulado** com credenciais de acesso
- **Expiração automática** em 24 horas
- **Redefinição obrigatória** no primeiro login
- **Notificações por email** para confirmações
- **Logs de auditoria** para segurança

### **✅ Melhorias de Segurança**

- **Validação de expiração** em tempo real
- **Hash seguro** mesmo para senhas provisórias
- **Tokens JWT** com validação de integridade
- **Middleware robusto** de autenticação

### **✅ API REST Completa**

- **9 endpoints** totalmente funcionais
- **Documentação completa** com exemplos
- **Testes automatizados** disponíveis
- **Sistema pronto para produção**

---

**Status: ✅ Sistema completo com autenticação avançada e senhas provisórias!**
