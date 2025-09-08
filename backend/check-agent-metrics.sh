#!/bin/bash

# Script para verificar se as métricas estão chegando
echo "🔍 Verificando métricas recebidas..."

# Usando psql para verificar diretamente no banco
echo "📊 Últimas métricas recebidas:"
echo "================================"

# Substituir pela sua string de conexão do DATABASE_URL
DATABASE_URL="postgresql://neondb_owner:npg_OIvb1PMxAh8W@ep-steep-cell-advmbqw9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Verificar agentes registrados
echo "🤖 Agentes registrados:"
psql "$DATABASE_URL" -c "SELECT id, hostname, status, \"lastSeen\", \"createdAt\" FROM \"Agent\" ORDER BY \"createdAt\" DESC LIMIT 5;"

echo ""
echo "📈 Últimas métricas:"
psql "$DATABASE_URL" -c "SELECT hostname, timestamp, \"cpuUsage\", \"memoryUsagePercent\", \"processesTotal\" FROM \"AgentMetrics\" ORDER BY timestamp DESC LIMIT 10;"

echo ""
echo "📊 Contagem de métricas por agente:"
psql "$DATABASE_URL" -c "SELECT hostname, COUNT(*) as total_metrics, MAX(timestamp) as last_metric FROM \"AgentMetrics\" GROUP BY hostname ORDER BY last_metric DESC;"
