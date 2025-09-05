#!/bin/bash

# InfraWatch InfluxDB Setup Script
# Este script automatiza a configuração inicial do InfluxDB para o projeto InfraWatch

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
INFLUXDB_VERSION="2.7"
INFLUXDB_PORT="8086"
INFLUXDB_USERNAME="admin"
INFLUXDB_PASSWORD="infrawatch123"
INFLUXDB_ORG="infrawatch"
INFLUXDB_BUCKET="metrics"

echo -e "${BLUE}🚀 InfraWatch InfluxDB Setup${NC}"
echo -e "${BLUE}================================${NC}\n"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado. Por favor, instale o Docker primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker encontrado${NC}"

# Verificar se a porta 8086 está livre
if lsof -Pi :8086 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Porta 8086 já está em uso. Parando processo existente...${NC}"
    docker stop influxdb 2>/dev/null || true
    docker rm influxdb 2>/dev/null || true
fi

# Baixar e iniciar InfluxDB
echo -e "${BLUE}📦 Baixando InfluxDB ${INFLUXDB_VERSION}...${NC}"
docker pull influxdb:${INFLUXDB_VERSION}

echo -e "${BLUE}🚀 Iniciando InfluxDB...${NC}"
docker run -d \
  --name influxdb \
  -p ${INFLUXDB_PORT}:8086 \
  -v influxdb-data:/var/lib/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=${INFLUXDB_USERNAME} \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=${INFLUXDB_PASSWORD} \
  -e DOCKER_INFLUXDB_INIT_ORG=${INFLUXDB_ORG} \
  -e DOCKER_INFLUXDB_INIT_BUCKET=${INFLUXDB_BUCKET} \
  -e DOCKER_INFLUXDB_INIT_RETENTION=30d \
  -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=infrawatch-admin-token-$(date +%s) \
  influxdb:${INFLUXDB_VERSION}

# Aguardar InfluxDB inicializar
echo -e "${YELLOW}⏳ Aguardando InfluxDB inicializar...${NC}"
sleep 10

# Verificar se InfluxDB está rodando
max_attempts=30
attempt=1

while ! curl -s http://localhost:${INFLUXDB_PORT}/health > /dev/null; do
    if [ $attempt -ge $max_attempts ]; then
        echo -e "${RED}❌ InfluxDB não inicializou após 60 segundos${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⏳ Tentativa ${attempt}/${max_attempts}...${NC}"
    sleep 2
    attempt=$((attempt + 1))
done

echo -e "${GREEN}✅ InfluxDB está rodando!${NC}"

# Obter token de admin
echo -e "${BLUE}🔑 Obtendo token de administração...${NC}"
ADMIN_TOKEN=$(docker exec influxdb influx auth list --user ${INFLUXDB_USERNAME} --hide-headers | awk '{print $3}' | head -1)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Não foi possível obter o token de administração${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token obtido: ${ADMIN_TOKEN}${NC}"

# Criar token específico para a aplicação
echo -e "${BLUE}🔐 Criando token específico para InfraWatch...${NC}"
APP_TOKEN=$(docker exec influxdb influx auth create \
  --org ${INFLUXDB_ORG} \
  --description "InfraWatch Application Token" \
  --read-buckets \
  --write-buckets \
  --token ${ADMIN_TOKEN} \
  --hide-headers | awk '{print $3}')

echo -e "${GREEN}✅ Token da aplicação criado: ${APP_TOKEN}${NC}"

# Verificar bucket
echo -e "${BLUE}📊 Verificando bucket de métricas...${NC}"
docker exec influxdb influx bucket list --org ${INFLUXDB_ORG} --token ${ADMIN_TOKEN} | grep -q ${INFLUXDB_BUCKET}
echo -e "${GREEN}✅ Bucket '${INFLUXDB_BUCKET}' disponível${NC}"

# Atualizar arquivo de configuração
ENV_FILE="ssss"
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}📝 Atualizando arquivo de configuração...${NC}"
    
    # Remover configurações antigas do InfluxDB se existirem
    sed -i '/^INFLUXDB_/d' "$ENV_FILE"
    
    # Adicionar novas configurações
    cat >> "$ENV_FILE" << EOF

# InfluxDB Configuration (Auto-generated)
INFLUXDB_URL="http://localhost:${INFLUXDB_PORT}"
INFLUXDB_TOKEN="${APP_TOKEN}"
INFLUXDB_ORG="${INFLUXDB_ORG}"
INFLUXDB_BUCKET="${INFLUXDB_BUCKET}"
EOF
    
    echo -e "${GREEN}✅ Configurações salvas em ${ENV_FILE}${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo ${ENV_FILE} não encontrado. Criando configurações manualmente:${NC}"
    cat << EOF

Adicione estas configurações ao seu arquivo de ambiente:

INFLUXDB_URL="http://localhost:${INFLUXDB_PORT}"
INFLUXDB_TOKEN="${APP_TOKEN}"
INFLUXDB_ORG="${INFLUXDB_ORG}"
INFLUXDB_BUCKET="${INFLUXDB_BUCKET}"
EOF
fi

# Testar conexão
echo -e "${BLUE}🧪 Testando conexão...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:${INFLUXDB_PORT}/health)
if echo "$HEALTH_CHECK" | grep -q '"status":"pass"'; then
    echo -e "${GREEN}✅ InfluxDB está saudável${NC}"
else
    echo -e "${YELLOW}⚠️  Status de saúde: ${HEALTH_CHECK}${NC}"
fi

# Informações finais
echo -e "\n${GREEN}🎉 Setup do InfluxDB concluído com sucesso!${NC}\n"

echo -e "${BLUE}📋 Informações de acesso:${NC}"
echo -e "  URL: http://localhost:${INFLUXDB_PORT}"
echo -e "  Usuário: ${INFLUXDB_USERNAME}"
echo -e "  Senha: ${INFLUXDB_PASSWORD}"
echo -e "  Organização: ${INFLUXDB_ORG}"
echo -e "  Bucket: ${INFLUXDB_BUCKET}"
echo -e "  Token da App: ${APP_TOKEN}"

echo -e "\n${BLUE}🔧 Comandos úteis:${NC}"
echo -e "  Parar InfluxDB:    docker stop influxdb"
echo -e "  Iniciar InfluxDB:  docker start influxdb"
echo -e "  Logs:              docker logs influxdb"
echo -e "  Interface Web:     http://localhost:${INFLUXDB_PORT}"

echo -e "\n${BLUE}🚀 Próximos passos:${NC}"
echo -e "  1. Reinicie sua aplicação NestJS"
echo -e "  2. Teste o endpoint: GET /metrics/health/influxdb"
echo -e "  3. Verifique os logs para confirmar a conexão"
echo -e "  4. Acesse http://localhost:${INFLUXDB_PORT} para o dashboard"

echo -e "\n${GREEN}✨ InfluxDB está pronto para receber métricas do InfraWatch!${NC}"
