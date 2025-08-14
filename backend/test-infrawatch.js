#!/usr/bin/env node

/**
 * Script Completo de Teste do InfraWatch
 * Testa todos os endpoints da API em JavaScript com Axios
 */

const axios = require('axios');
const fs = require('fs');

// Configurações
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Token JWT Admin válido
const ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidXNlcklkIjo4LCJlbWFpbCI6ImFkbWluQGluZnJhd2F0Y2guY29tIiwicm9sZSI6IkFETUlOIiwibmFtZSI6IkFkbWluIFVzZXIiLCJzdGF0dXMiOiJBQ1RJVkUiLCJpYXQiOjE3NTUwMTI5MjMsImV4cCI6MTc1NTA5OTMyM30.nInVnxE1vhseUUZv9-AImpgxhBZQBHcxnpH54GKrdbA';

// Configurar Axios com interceptors
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
apiClient.interceptors.request.use((config) => {
  if (config.useAuth !== false) {
    config.headers.Authorization = `Bearer ${ADMIN_TOKEN}`;
  }
  return config;
});

// Interceptor para log de requisições
apiClient.interceptors.request.use((config) => {
  console.log(
    `🔗 ${config.method?.toUpperCase()} ${config.url} ${
      config.useAuth !== false ? '🔒' : '🔓'
    }`,
  );
  return config;
});

// Interceptor para tratamento de respostas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não rejeitar, apenas retornar o erro para tratamento
    return Promise.resolve(
      error.response || { status: 0, data: { error: error.message } },
    );
  },
);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Utilitários de logging
const log = (message, color = 'cyan') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}]${colors.reset} ${message}`);
};

const success = (message) =>
  console.log(`${colors.green}✓${colors.reset} ${message}`);
const error = (message) =>
  console.log(`${colors.red}✗${colors.reset} ${message}`);
const warning = (message) =>
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
const info = (message) =>
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);

// Estatísticas dos testes
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Função para exibir dados detalhados
function showDetailedData(name, data, showFull = false) {
  console.log(`\n${colors.cyan}📋 ${name}:${colors.reset}`);

  if (Array.isArray(data)) {
    console.log(
      `   ${colors.green}📊 Array com ${data.length} itens${colors.reset}`,
    );
    data.forEach((item, index) => {
      if (index < 3 || showFull) {
        // Mostrar primeiros 3 ou todos se showFull
        console.log(
          `   ${colors.yellow}[${index}]${colors.reset} ${JSON.stringify(
            item,
            null,
            2,
          )
            .split('\n')
            .map((line) => '       ' + line)
            .join('\n')
            .trim()}`,
        );
      } else if (index === 3) {
        console.log(
          `   ${colors.gray}... e mais ${data.length - 3} itens${colors.reset}`,
        );
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    const formatted = JSON.stringify(data, null, 2)
      .split('\n')
      .map((line) => '   ' + line)
      .join('\n');
    console.log(`${colors.yellow}${formatted}${colors.reset}`);
  } else {
    console.log(`   ${colors.green}${data}${colors.reset}`);
  }
  console.log('');
}

// Função para testar um endpoint usando Axios
async function testEndpoint(
  name,
  method,
  path,
  expectedStatus = 200,
  data = null,
  useAuth = true,
  showDetails = false,
) {
  stats.total++;

  try {
    const config = {
      method: method.toLowerCase(),
      url: path,
      useAuth,
      ...(data && { data }),
    };

    log(
      `Testing ${method.toUpperCase()} ${path}${useAuth ? ' 🔒' : ' 🔓'}...`,
      'cyan',
    );

    const response = await apiClient(config);

    const isExpectedStatus = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    if (isExpectedStatus) {
      const preview = JSON.stringify(response.data).substring(0, 100);
      success(`${name}: ${response.status} - ${preview}...`);

      // Mostrar dados detalhados se solicitado
      if (showDetails && response.data) {
        showDetailedData(name, response.data);
      }

      stats.passed++;
      return response;
    } else {
      const preview = JSON.stringify(response.data).substring(0, 100);
      error(
        `${name}: Expected ${expectedStatus}, got ${response.status} - ${preview}...`,
      );

      // Mostrar dados detalhados mesmo em erro para debug
      if (showDetails && response.data) {
        showDetailedData(`${name} (ERROR)`, response.data);
      }

      stats.failed++;
      return response;
    }
  } catch (err) {
    error(`${name}: Error - ${err.message}`);
    stats.failed++;
    return null;
  }
}

// Função auxiliar para testar endpoints PDF com URL absoluta
async function testPDFEndpoint(
  name,
  method,
  path,
  expectedStatus = 200,
  data = null,
  showDetails = false,
) {
  const absoluteUrl = `${BASE_URL}/api/sla/reports${
    path.startsWith('/') ? path : '/' + path
  }`;

  try {
    const config = {
      method: method.toLowerCase(),
      url: absoluteUrl,
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      ...(data && { data }),
    };

    stats.total++;
    log(`Testing ${method.toUpperCase()} ${absoluteUrl} 🔒...`, 'cyan');

    const response = await axios(config);

    const isExpectedStatus = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    if (isExpectedStatus) {
      const preview = JSON.stringify(response.data).substring(0, 100);
      success(`${name}: ${response.status} - ${preview}...`);

      if (showDetails && response.data) {
        showDetailedData(name, response.data);
      }

      stats.passed++;
      return response;
    } else {
      const preview = JSON.stringify(response.data).substring(0, 100);
      error(
        `${name}: Expected ${expectedStatus}, got ${response.status} - ${preview}...`,
      );

      if (showDetails && response.data) {
        showDetailedData(`${name} (ERROR)`, response.data);
      }

      stats.failed++;
      return response;
    }
  } catch (err) {
    stats.total++;
    const response = err.response;
    if (response) {
      const preview = JSON.stringify(response.data).substring(0, 100);
      error(
        `${name}: Expected ${expectedStatus}, got ${response.status} - ${preview}...`,
      );

      if (showDetails && response.data) {
        showDetailedData(`${name} (ERROR)`, response.data);
      }

      stats.failed++;
      return response;
    } else {
      error(`${name}: Error - ${err.message}`);
      stats.failed++;
      return null;
    }
  }
}

// Função auxiliar para testar endpoints SLA com URL absoluta
async function testSLAEndpoint(
  name,
  method,
  path,
  expectedStatus = 200,
  data = null,
  showDetails = false,
) {
  const absoluteUrl = `${BASE_URL}/api/sla${
    path.startsWith('/') ? path : '/' + path
  }`;

  try {
    const config = {
      method: method.toLowerCase(),
      url: absoluteUrl,
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      ...(data && { data }),
    };

    stats.total++;
    log(`Testing ${method.toUpperCase()} ${absoluteUrl} 🔒...`, 'cyan');

    const response = await axios(config);

    const isExpectedStatus = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    if (isExpectedStatus) {
      const preview = JSON.stringify(response.data).substring(0, 100);
      success(`${name}: ${response.status} - ${preview}...`);

      if (showDetails && response.data) {
        showDetailedData(name, response.data);
      }

      stats.passed++;
      return response;
    } else {
      const preview = JSON.stringify(response.data).substring(0, 100);
      error(
        `${name}: Expected ${expectedStatus}, got ${response.status} - ${preview}...`,
      );

      if (showDetails && response.data) {
        showDetailedData(`${name} (ERROR)`, response.data);
      }

      stats.failed++;
      return response;
    }
  } catch (err) {
    stats.total++;
    const response = err.response;
    if (response) {
      const preview = JSON.stringify(response.data).substring(0, 100);
      error(
        `${name}: Expected ${expectedStatus}, got ${response.status} - ${preview}...`,
      );

      if (showDetails && response.data) {
        showDetailedData(`${name} (ERROR)`, response.data);
      }

      stats.failed++;
      return response;
    } else {
      error(`${name}: Error - ${err.message}`);
      stats.failed++;
      return null;
    }
  }
}

// Função para gerar dados de teste
function generateTestData() {
  const hosts = [
    'web-server-01',
    'db-server-01',
    'api-gateway',
    'load-balancer',
    'cache-server',
  ];
  const metrics = [];

  for (let day = 0; day < 7; day++) {
    for (const host of hosts) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(hour, 0, 0, 0);

        const status = Math.random() > 0.1 ? 'UP' : 'DOWN';
        const responseTime = Math.floor(Math.random() * 1000) + 50;

        metrics.push({
          host,
          status,
          responseTime,
          timestamp: timestamp.toISOString(),
          errorMessage: status === 'DOWN' ? 'Connection timeout' : null,
        });
      }
    }
  }

  return { hosts, metrics };
}

// Função principal de teste
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('=========================================');
  console.log('🚀 TESTE COMPLETO DO INFRAWATCH API');
  console.log('🔗 Usando Axios para requisições HTTP');
  console.log('=========================================');
  console.log(colors.reset);

  // Teste de conectividade inicial
  log('🔗 Testando conectividade com o servidor...', 'cyan');
  try {
    const connectTest = await apiClient.get('/health', { useAuth: false });
    if (connectTest.status === 200) {
      success('Conectividade OK - Servidor respondendo');
    } else {
      warning(`Servidor respondeu com status ${connectTest.status}`);
    }
  } catch (err) {
    error('Erro de conectividade - Verifique se o servidor está rodando');
    return;
  }

  let userToken = null;
  let serviceIds = [];
  let userIds = [];

  // 1. TESTES DE SAÚDE E BÁSICOS
  log('\n1. TESTANDO ENDPOINTS BÁSICOS', 'magenta');
  await testEndpoint('Health Check', 'GET', '/health', 200, null, false);

  // 2. TESTES DE USUÁRIOS E AUTENTICAÇÃO
  log('\n2. TESTANDO AUTENTICAÇÃO E USUÁRIOS', 'magenta');

  // Registro de usuário
  const userData = {
    name: 'Test User JS',
    email: 'testjs@example.com',
    password: 'password123',
    role: 'USER',
  };

  const registerResponse = await testEndpoint(
    'User Registration',
    'POST',
    '/users/register',
    [201, 409],
    userData,
    false,
  );

  // Login com credenciais admin
  const loginData = {
    email: 'admin@infrawatch.com',
    password: 'admin123',
  };

  const loginResponse = await testEndpoint(
    'User Login',
    'POST',
    '/users/login',
    200,
    loginData,
    false,
  );
  if (loginResponse && loginResponse.data.token) {
    userToken = loginResponse.data.token;
    success('Token de usuário obtido');
  }

  // Tentar login com usuário criado também
  const newUserLoginData = {
    email: 'testjs@example.com',
    password: 'password123',
  };

  await testEndpoint(
    'New User Login',
    'POST',
    '/users/login',
    [200, 201],
    newUserLoginData,
    false,
  );

  // Perfil do usuário
  await testEndpoint('User Profile', 'GET', '/users/profile', 200);

  // Listar usuários (admin only)
  const usersResponse = await testEndpoint('List Users', 'GET', '/users', 200);
  if (
    usersResponse &&
    usersResponse.data &&
    Array.isArray(usersResponse.data)
  ) {
    userIds = usersResponse.data.map((u) => u.id).slice(0, 3);
  }

  // 3. TESTES DE MÉTRICAS
  log('\n3. TESTANDO MÉTRICAS', 'magenta');

  const testData = generateTestData();

  // Criar algumas métricas
  for (let i = 0; i < 10; i++) {
    const metric = testData.metrics[i];
    await testEndpoint(
      `Create Metric ${i + 1}`,
      'POST',
      '/metrics',
      [201, 200],
      metric,
      false,
    );
  }

  // Listar métricas
  await testEndpoint(
    'List All Metrics',
    'GET',
    '/metrics',
    200,
    null,
    true, // useAuth = true
    true,
  );

  // Métricas por host
  for (const host of testData.hosts.slice(0, 2)) {
    await testEndpoint(
      `Metrics for ${host}`,
      'GET',
      `/metrics/${host}`,
      200,
      null,
      true, // useAuth = true
      true, // showDetails
    );
  }

  // 4. TESTES DE SERVIÇOS
  log('\n4. TESTANDO SERVIÇOS', 'magenta');

  // Serviços HTTP
  const httpServiceData = {
    name: 'Test HTTP Service',
    url: 'http://google.com',
    interval: 60,
    timeout: 5000,
    active: true,
    description: 'Service created by JS test',
  };

  const httpResponse = await testEndpoint(
    'Create HTTP Service',
    'POST',
    '/http',
    [201, 200],
    httpServiceData,
    true, // useAuth
    true, // showDetails
  );
  if (httpResponse && httpResponse.data && httpResponse.data.id) {
    serviceIds.push(httpResponse.data.id);
  }

  await testEndpoint(
    'List HTTP Services',
    'GET',
    '/http',
    200,
    null,
    true,
    true,
  );

  // Serviços Ping
  const pingServiceData = {
    name: 'Test Ping Service',
    host: '8.8.8.8',
    interval: 30,
    timeout: 3000,
    active: true,
    description: 'Ping service created by JS test',
  };

  const pingResponse = await testEndpoint(
    'Create Ping Service',
    'POST',
    '/ping',
    [201, 200],
    pingServiceData,
    true, // useAuth
    true, // showDetails
  );
  if (pingResponse && pingResponse.data && pingResponse.data.id) {
    serviceIds.push(pingResponse.data.id);
  }

  await testEndpoint(
    'List Ping Services',
    'GET',
    '/ping',
    200,
    null,
    true,
    true,
  );

  // 5. TESTES DE MONITORAMENTO
  log('\n5. TESTANDO MONITORAMENTO', 'magenta');

  // Teste de ping
  const pingTestData = {
    host: '8.8.8.8',
    count: 3,
    timeout: 3000,
  };

  await testEndpoint(
    'Monitor Ping Test',
    'POST',
    '/monitors/test/ping',
    [200, 201], // aceitar tanto 200 quanto 201
    pingTestData,
  );

  // Estatísticas do monitor
  await testEndpoint('Monitor Stats', 'GET', '/monitors/stats', 200);

  // Teste de serviço específico
  if (serviceIds.length > 0) {
    await testEndpoint(
      'Test Service Monitor',
      'POST',
      `/monitors/test/service/${serviceIds[0]}`,
      [200, 404],
      null,
    );
  }

  // 6. TESTES DE SLA
  log('\n6. TESTANDO SLA', 'magenta');

  // Calcular SLA
  const slaData = {
    serviceId: serviceIds[0] || 1,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  };

  await testSLAEndpoint(
    'Calculate SLA',
    'POST',
    '/calculate',
    [200, 404],
    slaData,
    true, // showDetails
  );

  // Resumo de SLA
  await testSLAEndpoint('SLA Summary', 'GET', '/summary', 200, null, true);

  if (serviceIds.length > 0) {
    await testSLAEndpoint(
      'SLA Summary by Service',
      'GET',
      `/summary/${serviceIds[0]}`,
      [200, 404],
      null,
      true, // showDetails
    );
    await testSLAEndpoint(
      'SLA Today',
      'GET',
      `/today/${serviceIds[0]}`,
      [200, 404],
      null,
      true, // showDetails
    );
    await testSLAEndpoint(
      'SLA Current Month',
      'GET',
      `/current-month/${serviceIds[0]}`,
      [200, 404],
      null,
      true, // showDetails
    );
    await testSLAEndpoint(
      'SLA Last Week',
      'GET',
      `/last-week/${serviceIds[0]}`,
      [200, 404],
      null,
      true, // showDetails
    );
  }

  // 7. TESTES DE RELATÓRIOS PDF
  log('\n7. TESTANDO RELATÓRIOS PDF', 'magenta');

  // Listar relatórios
  await testPDFEndpoint('List PDF Reports', 'GET', '/list', 200, null, true);

  // Gerar relatório PDF
  if (serviceIds.length > 0) {
    await testPDFEndpoint(
      'Generate PDF Report',
      'POST',
      `/generate/${serviceIds[0]}`,
      [200, 201, 404],
      null,
      true, // showDetails
    );
  }

  // Relatório demo
  await testPDFEndpoint('Demo PDF Report', 'GET', '/demo', 200, null, true);
  await testPDFEndpoint('Demo PDF File', 'GET', '/demo-pdf', 200, null, true);

  // 8. TESTES DE NOTIFICAÇÕES
  log('\n8. TESTANDO NOTIFICAÇÕES', 'magenta');

  await testEndpoint(
    'Send Alert',
    'GET',
    '/notifications/send-alert',
    [200, 500],
    null,
    false,
  );
  await testEndpoint(
    'Test Telegram',
    'GET',
    '/notifications/test-telegram',
    [200, 500],
    null,
    false,
  );
  await testEndpoint(
    'Test Email',
    'GET',
    '/notifications/test-email',
    [200, 500],
    null,
    false,
  );
  await testEndpoint(
    'Test Slack',
    'GET',
    '/notifications/test-slack',
    [200, 500],
    null,
    false,
  );

  // 9. TESTES DE ATUALIZAÇÃO E EXCLUSÃO
  log('\n9. TESTANDO OPERAÇÕES DE ATUALIZAÇÃO', 'magenta');

  // Atualizar usuário
  if (userIds.length > 0) {
    const updateUserData = {
      name: 'Updated User Name',
      email: 'updated@example.com',
    };
    await testEndpoint(
      'Update User',
      'PUT',
      '/users/update-user',
      [200, 404],
      updateUserData,
    );

    // Buscar usuário por ID
    await testEndpoint(
      'Get User by ID',
      'GET',
      `/users/${userIds[0]}`,
      [200, 404],
    );
  }

  // Atualizar serviços
  if (serviceIds.length > 0) {
    const updateServiceData = {
      name: 'Updated Service Name',
      active: false,
    };

    await testEndpoint(
      'Update HTTP Service',
      'PUT',
      `/http/${serviceIds[0]}`,
      [200, 404],
      updateServiceData,
    );
    await testEndpoint(
      'Get HTTP Service by ID',
      'GET',
      `/http/${serviceIds[0]}`,
      [200, 404],
    );
  }

  // 10. TESTES DE EXCLUSÃO
  log('\n10. TESTANDO EXCLUSÕES', 'magenta');

  // Deletar serviços criados (limpeza)
  for (const serviceId of serviceIds) {
    await testEndpoint(
      'Delete HTTP Service',
      'DELETE',
      `/http/${serviceId}`,
      [200, 404, 204],
    );
    await testEndpoint(
      'Delete Ping Service',
      'DELETE',
      `/ping/${serviceId}`,
      [200, 404, 204],
    );
  }

  // RELATÓRIO FINAL
  console.log(`\n${colors.bright}${colors.magenta}`);
  console.log('=========================================');
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('=========================================');
  console.log(colors.reset);

  console.log(`${colors.cyan}Total de testes:${colors.reset} ${stats.total}`);
  console.log(`${colors.green}Testes passaram:${colors.reset} ${stats.passed}`);
  console.log(`${colors.red}Testes falharam:${colors.reset} ${stats.failed}`);
  console.log(
    `${colors.yellow}Testes pulados:${colors.reset} ${stats.skipped}`,
  );

  const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
  console.log(
    `${colors.bright}Taxa de sucesso:${colors.reset} ${successRate}%`,
  );

  if (stats.failed === 0) {
    success('\n🎉 Todos os testes passaram!');
  } else {
    warning(`\n⚠️  ${stats.failed} teste(s) falharam`);
  }

  // Verificar arquivos PDF gerados
  console.log('\n📄 VERIFICANDO ARQUIVOS PDF:');
  try {
    const files = fs.readdirSync('.').filter((f) => f.endsWith('.pdf'));
    if (files.length > 0) {
      success(`${files.length} arquivo(s) PDF encontrado(s):`);
      files.forEach((file) => console.log(`   - ${file}`));
    } else {
      info('Nenhum arquivo PDF encontrado no diretório atual');
    }
  } catch (err) {
    warning('Erro ao verificar arquivos PDF');
  }

  console.log(
    `\n${colors.bright}${colors.green}✅ Teste completo finalizado!${colors.reset}\n`,
  );
}

// Executar os testes
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint, apiClient };
