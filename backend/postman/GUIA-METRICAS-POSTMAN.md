# 📊 Guia - Visualizar Métricas de Agentes via Postman

## 📁 Importar Coleção

1. Abra o Postman
2. Clique em **Import**
3. Selecione: `postman/InfraWatch-Metricas-Agentes.json`
4. Importe a coleção

## 🔧 Configuração Inicial

### 1. Atualizar sua senha
No request **"1. Login"**, altere:
```json
{
  "email": "vicor32leonel@gmail.com",
  "password": "SUA_SENHA_REAL_AQUI"
}
```

### 2. Verificar URL base
A coleção já está configurada para:
```
base_url: https://infra42luanda.duckdns.org
```

## 🚀 Como Usar (Passo a Passo)

### **Passo 1: Login**
Execute o request **"1. Login"**
- ✅ Token é salvo automaticamente
- ✅ Pode ser usado em todos os outros requests

### **Passo 2: Listar Agentes**
Execute **"2. Listar Todos os Agentes"**
- ✅ Mostra todos os agentes instalados
- ✅ Salva automaticamente o ID do primeiro agente
- ✅ Exibe resumo no console

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "7c959f3b-54dc-49ae-9ab0-960b89afbb4c",
      "hostname": "vmi2762389",
      "ip": "192.168.1.100",
      "os": "Linux",
      "arch": "x86_64",
      "status": "ACTIVE",
      "lastSeen": "2025-09-07T15:30:45.000Z",
      "createdAt": "2025-09-07T14:20:10.000Z"
    }
  ]
}
```

### **Passo 3: Ver Métricas Recentes (1 hora)**
Execute **"3. Métricas da Última 1 Hora"**
- 📊 Mostra métricas mais recentes
- 📈 Exibe última leitura no console

### **Passo 4: Ver Histórico (24 horas)**
Execute **"4. Métricas das Últimas 24 Horas"**
- 📊 Histórico completo
- 📈 Calcula médias e picos automaticamente

### **Passo 5: Agente Específico**
Se você souber o ID do agente:
1. Use **"5. Métricas Específicas por Agent ID"**
2. Substitua `SEU_AGENT_ID_AQUI` pelo ID real
3. Ajuste o parâmetro `hours` conforme necessário

## 📊 Dados das Métricas

### Estrutura de uma métrica:
```json
{
  "id": 123,
  "agentId": "7c959f3b-54dc-49ae-9ab0-960b89afbb4c",
  "hostname": "vmi2762389",
  "timestamp": "2025-09-07T15:30:45.000Z",
  "cpuUsage": 45.2,
  "cpuCores": 4,
  "load1": 1.2,
  "load5": 1.5,
  "load15": 1.1,
  "memoryTotal": "8589934592",
  "memoryUsed": "4294967296", 
  "memoryFree": "2147483648",
  "memoryAvailable": "6442450944",
  "memoryUsagePercent": 50.0,
  "diskData": "[{\"device\":\"/dev/sda1\",\"percent\":20.0}]",
  "networkData": "[{\"interface\":\"eth0\",\"bytes_sent\":1073741824}]",
  "processesTotal": 150,
  "processesRunning": 2,
  "processesSleeping": 145,
  "processesZombie": 0,
  "uptime": "86400",
  "createdAt": "2025-09-07T15:30:45.000Z"
}
```

## 🔍 Parâmetros Importantes

### Hours (Período de Consulta)
- `hours=1` - Última 1 hora
- `hours=6` - Últimas 6 horas  
- `hours=24` - Últimas 24 horas (padrão)
- `hours=168` - Última semana

### URLs dos Endpoints

| Endpoint | Descrição | Método |
|----------|-----------|--------|
| `/agents` | Listar agentes | GET |
| `/agents/{id}` | Detalhes do agente | GET |
| `/agents/{id}/metrics` | Métricas do agente | GET |
| `/agents/{id}/metrics?hours=X` | Métricas período específico | GET |

## 💡 Console do Postman

A coleção mostra informações úteis no console:

```
✅ Token salvo: eyJhbGciOiJIUzI1NiIs...
📊 Agentes encontrados: 1
🤖 Agente 1: vmi2762389 (ACTIVE) - Last seen: 2025-09-07T15:30:45.000Z
📊 Métricas encontradas: 25
🔥 Última métrica:
  CPU: 45.2%
  RAM: 67.8%
  Processos: 150
  Timestamp: 2025-09-07T15:30:45.000Z
📈 Estatísticas 24h:
  CPU - Média: 42.1%, Pico: 89.3%
  RAM - Média: 65.2%, Pico: 78.9%
```

## 🎯 Monitoramento em Tempo Real

Para monitorar em tempo real:
1. Execute **"3. Métricas da Última 1 Hora"** repetidamente
2. Use o **Collection Runner** para automático
3. Configure intervalo de 60s para sincronizar com o agente

## 🔧 Troubleshooting

### Erro 401 (Unauthorized)
- Refaça o login (Passo 1)
- Verifique se a senha está correta

### Erro 404 (Agent not found)
- Execute "Listar Agentes" primeiro
- Verifique se o agent_id está correto
- Certifique-se de que o agente está registrado

### Nenhuma métrica encontrada
- Verifique se o agente está rodando: `systemctl status infrawatch-agent`
- Veja os logs: `journalctl -u infrawatch-agent -f`
- Aguarde 1-2 minutos para primeira métrica

## 🚀 Resultado Esperado

Após executar todos os passos, você terá:
- ✅ Lista de agentes ativos
- ✅ Métricas em tempo real
- ✅ Histórico de performance  
- ✅ Estatísticas calculadas automaticamente
