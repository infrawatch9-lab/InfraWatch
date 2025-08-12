# 🎯 Teste SLA - Consumo HTTP API

Este arquivo contém um teste completo da funcionalidade SLA através do consumo direto da API HTTP.

## 🚀 Como executar

### 1. Iniciar o servidor (em um terminal)

```bash
cd backend
npm run dev
```

### 2. Executar o teste SLA (em outro terminal)

```bash
cd backend
npm run test:sla-ts
```

## 📋 O que o teste faz

### ✅ Funcionalidades testadas com sucesso:

1. **🔐 Autenticação**

   - Login com admin@infrawatch.com
   - Obtenção e uso do token JWT

2. **🏗️ Criação de dados de teste**

   - Criação de serviço temporário
   - Geração de métricas de teste

3. **🧮 Cálculo de SLA**

   - POST `/api/sla/calculate`
   - Retorna: uptime, downtime, status, incidentes
   - Status: 201 Created ✅

4. **📋 Summary de SLA**

   - GET `/api/sla/summary/{serviceId}`
   - Retorna: dados do mês, 30d, 7d
   - Status: 200 OK ✅

5. **📈 Tendência de SLA**

   - GET `/api/sla/trend/{serviceId}?days=3`
   - Retorna: dados dos últimos dias
   - Status: 200 OK ✅

6. **🔒 Segurança**
   - Teste sem token de autorização
   - Retorna: 401 Unauthorized ✅

### 🧹 Limpeza automática

- Remove dados de teste ao final
- Desconecta do banco de dados

## 📊 Exemplo de saída

```
🚀 TESTE SLA COMPLETO - CONSUMO HTTP API
============================================================

🔐 Fazendo login...
✅ Login OK

🏗️ Criando serviço...
✅ Serviço criado: 90

📊 Criando dados...
✅ 5 métricas criadas

🧮 Testando cálculo SLA...
✅ SLA calculado: 100%
⏱️  Total: 360 min
❌ Downtime: 0 min
🎯 Status: OK
🚨 Incidentes: 0

📋 Testando summary...
✅ Summary OK: Teste SLA Debug
📅 Mês: 100%
📅 30d: 100%
📅 7d: 100%

📈 Testando tendência...
Data       | Uptime | Incidentes
------------------------------
09/08/2025 | 100.0%   | 0
10/08/2025 | 100.0%   | 0
11/08/2025 | 100.0%   | 0

🔒 Testando segurança...
✅ Sem token: 401 (Correto)

✅ TESTE CONCLUÍDO!
🧹 Limpeza OK
```

## 🎯 Resumo

O teste demonstra que a API SLA está funcionando corretamente:

- ✅ Todos os endpoints principais funcionam
- ✅ Autenticação JWT implementada
- ✅ Cálculos de SLA corretos (100% uptime)
- ✅ Dados visuais claros e organizados
- ✅ Limpeza automática dos dados de teste

**Status: 🟢 APROVADO - API SLA funcionando perfeitamente!**
