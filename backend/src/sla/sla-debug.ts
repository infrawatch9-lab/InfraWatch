import axios from 'axios';
import { PrismaClient, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3042/api';

async function testSLA() {
  console.log('\n🚀 TESTE SLA COMPLETO - CONSUMO HTTP API');
  console.log('='.repeat(60));

  let testServiceId: number = 0;
  let accessToken: string = '';

  try {
    // 1. Login
    console.log('\n🔐 Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@infrawatch.com',
      password: 'admin123',
    });

    if (loginResponse.status === 201) {
      accessToken = loginResponse.data.tokens.accessToken;
      console.log('✅ Login OK');
    } else {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    // 2. Criar serviço
    console.log('\n🏗️ Criando serviço...');
    const service = await prisma.service.create({
      data: {
        name: 'Teste SLA Debug',
        description: 'Teste',
        type: 'API',
        status: ServiceStatus.UP,
        teamId: 1,
      },
    });
    testServiceId = service.id;
    console.log(`✅ Serviço criado: ${testServiceId}`);

    // 3. Criar métricas básicas
    console.log('\n📊 Criando dados...');
    const now = new Date();
    const metrics = [];

    for (let i = 0; i < 5; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      metrics.push({
        serviceId: testServiceId,
        timestamp,
        cpu: 30,
        memory: 40,
        latency: 50,
        status: ServiceStatus.UP,
      });
    }

    await prisma.metric.createMany({ data: metrics });
    console.log(`✅ ${metrics.length} métricas criadas`);

    // 4. Testar cálculo SLA
    console.log('\n🧮 Testando cálculo SLA...');
    const periodStart = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();

    try {
      const slaResponse = await axios.post(
        `${BASE_URL}/sla/calculate`,
        {
          serviceId: testServiceId,
          periodStart,
          periodEnd,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      console.log(`📊 Status: ${slaResponse.status}`);
      console.log(`📊 Data:`, JSON.stringify(slaResponse.data, null, 2));

      if (
        (slaResponse.status === 200 || slaResponse.status === 201) &&
        slaResponse.data.success
      ) {
        const sla = slaResponse.data.data;
        console.log(`✅ SLA calculado: ${sla.uptimePct}%`);
        console.log(`⏱️  Total: ${sla.totalMinutes} min`);
        console.log(`❌ Downtime: ${sla.downtimeMinutes} min`);
        console.log(`🎯 Status: ${sla.status}`);
        console.log(`🚨 Incidentes: ${sla.incidents?.length || 0}`);
      } else {
        console.log('❌ Falha no cálculo SLA');
      }
    } catch (error: any) {
      console.log(`❌ Erro na requisição SLA:`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Data:`, error.response?.data);
      console.log(`   Message: ${error.message}`);
    }

    // 5. Testar summary
    console.log('\n📋 Testando summary...');
    try {
      const summaryResponse = await axios.get(
        `${BASE_URL}/sla/summary/${testServiceId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      console.log(`📊 Summary Status: ${summaryResponse.status}`);
      if (summaryResponse.status === 200) {
        const summary = summaryResponse.data.data;
        console.log(`✅ Summary OK: ${summary.serviceName}`);
        console.log(`📅 Mês: ${summary.currentMonth.uptimePct}%`);
        console.log(`📅 30d: ${summary.last30Days.uptimePct}%`);
        console.log(`📅 7d: ${summary.last7Days.uptimePct}%`);
      }
    } catch (error: any) {
      console.log(`❌ Erro no summary: ${error.response?.status}`);
    }

    // 6. Testar tendência
    console.log('\n📈 Testando tendência...');
    try {
      const trendResponse = await axios.get(
        `${BASE_URL}/sla/trend/${testServiceId}?days=3`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (trendResponse.status === 200) {
        const trends = trendResponse.data.data;
        console.log('Data       | Uptime | Incidentes');
        console.log('-'.repeat(30));
        trends.slice(0, 3).forEach((day: any) => {
          const date = new Date(day.date).toLocaleDateString('pt-BR');
          console.log(
            `${date} | ${day.uptimePct.toFixed(1)}%   | ${day.incidentCount}`,
          );
        });
      }
    } catch (error: any) {
      console.log(`❌ Erro na tendência: ${error.response?.status}`);
    }

    // 7. Testar dashboard
    console.log('\n🎨 Testando dashboard...');
    try {
      const dashResponse = await axios.get(`${BASE_URL}/sla/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (dashResponse.status === 200) {
        const services = dashResponse.data.data;
        const total = dashResponse.data.count;
        console.log(`📊 Total: ${total} serviços`);
        console.log(`🏷️  Primeiros 3:`);
        services.slice(0, 3).forEach((service: any, i: number) => {
          console.log(
            `   ${i + 1}. ${service.serviceName}: ${
              service.currentMonth.uptimePct
            }%`,
          );
        });
      }
    } catch (error: any) {
      console.log(`❌ Erro no dashboard: ${error.response?.status}`);
    }

    // 8. Testar segurança
    console.log('\n🔒 Testando segurança...');
    try {
      await axios.get(`${BASE_URL}/sla/summary/${testServiceId}`);
      console.log('❌ Deveria ter falhado sem token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Sem token: 401 (Correto)');
      }
    }

    // 9. Testar rotas de conveniência
    console.log('\n⚙️ Testando rotas de conveniência...');
    const routes = [
      { path: `today/${testServiceId}`, name: 'Hoje' },
      { path: `current-month/${testServiceId}`, name: 'Mês' },
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(`${BASE_URL}/sla/${route.path}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200) {
          console.log(`📅 ${route.name}: ${response.data.data.uptimePct}%`);
        }
      } catch (error: any) {
        console.log(`❌ ${route.name}: ${error.response?.status}`);
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO!');
  } catch (error: any) {
    console.error('\n❌ ERRO GERAL:', error.message);
  } finally {
    // Limpeza
    if (testServiceId) {
      try {
        await prisma.metric.deleteMany({ where: { serviceId: testServiceId } });
        await prisma.service.delete({ where: { id: testServiceId } });
        console.log('\n🧹 Limpeza OK');
      } catch (e) {
        console.log('\n⚠️  Erro na limpeza');
      }
    }
    await prisma.$disconnect();
  }
}

testSLA().catch(console.error);
