# InfraWatch Backend

Backend da aplicação InfraWatch com conexão à base de dados PostgreSQL usando Prisma e TimescaleDB.

## Configuração da Base de Dados

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/infrawatch?schema=public"

# Application Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (for authentication)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### 3. Configurar PostgreSQL com TimescaleDB

1. Instalar PostgreSQL e TimescaleDB
2. Criar a base de dados:
   ```sql
   CREATE DATABASE infrawatch;
   ```
3. Ativar a extensão TimescaleDB:
   ```sql
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   ```

### 4. Executar Migrações

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Configurar TimescaleDB hypertables (executar no PostgreSQL)
```

Após executar as migrações, execute os seguintes comandos SQL no PostgreSQL:

```sql
-- Converter tabela metrics em hypertable
SELECT create_hypertable('metrics', 'timestamp');

-- Converter tabela system_logs em hypertable  
SELECT create_hypertable('system_logs', 'timestamp');

-- Opcional: Configurar compressão automática após 7 dias
ALTER TABLE metrics SET (timescaledb.compress);
SELECT add_compression_policy('metrics', INTERVAL '7 days');

ALTER TABLE system_logs SET (timescaledb.compress);
SELECT add_compression_policy('system_logs', INTERVAL '7 days');
```

### 5. Executar a Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm start
```

## Estrutura da Base de Dados

### Modelos Principais

- **User**: Utilizadores do sistema
- **Team**: Equipas de trabalho
- **Service**: Serviços monitorizados (servidores, sites, APIs)
- **Metric**: Dados de performance históricos (TimescaleDB)
- **Alert**: Alertas gerados automaticamente
- **AlertRule**: Regras para disparar alertas
- **Notification**: Notificações enviadas aos utilizadores
- **SLA**: Contratos de disponibilidade
- **SystemLog**: Logs do sistema (TimescaleDB)

### Utilização da Conexão

A conexão à base de dados está configurada através do `DatabaseService` que pode ser injetado em qualquer serviço:

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MyService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUsers() {
    return await this.databaseService.user.findMany();
  }

  async createUser(data: { name: string; email: string; password: string }) {
    return await this.databaseService.user.create({
      data,
    });
  }
}
```

## Funcionalidades

- ✅ Conexão à base de dados PostgreSQL
- ✅ Suporte para TimescaleDB (dados temporais)
- ✅ Prisma ORM com TypeScript
- ✅ NestJS framework
- ✅ Estrutura modular
- ✅ Logs de queries
- ✅ Gestão automática de conexões

## Próximos Passos

1. Implementar autenticação JWT
2. Criar controllers para as APIs
3. Implementar serviços de monitorização
4. Configurar notificações (email, Slack, Telegram)
5. Implementar dashboards e relatórios 