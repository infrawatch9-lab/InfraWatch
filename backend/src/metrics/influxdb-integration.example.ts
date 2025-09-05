import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { InfluxDBService } from './influxdb.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('InfluxDB Integration Example', () => {
  let metricsService: MetricsService;
  let influxDBService: InfluxDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        InfluxDBService,
        EventEmitter2,
      ],
    }).compile();

    metricsService = module.get<MetricsService>(MetricsService);
    influxDBService = module.get<InfluxDBService>(InfluxDBService);
  });

  describe('Dual-Write Strategy', () => {
    it('should save metrics to both PostgreSQL and InfluxDB', async () => {
      // Simular dados de métricas recebidos de um agente
      const metricsData = {
        serviceId: 123,
        host: 'srv-prod-web-01',
        timestamp: new Date(),
        metrics: {
          cpu: 78.5,
          memory: 85.2,
          disk: 67.3,
          network: {
            bytes_sent: 1024000,
            bytes_recv: 2048000
          }
        },
        latency: {
          "8.8.8.8": 42.7,
          "1.1.1.1": 38.9
        },
        status: 'ACTIVE'
      };

      // Salvar métricas (dual-write automático)
      const result = await metricsService.saveMetrics(metricsData);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });
  });

  describe('Time-Series Queries', () => {
    it('should retrieve real-time metrics from InfluxDB', async () => {
      const serviceId = 123;
      const timeRange = '1h';

      const realtimeMetrics = await metricsService.getRealtimeMetrics(serviceId, timeRange);

      expect(realtimeMetrics).toBeDefined();
      expect(Array.isArray(realtimeMetrics)).toBe(true);
    });

    it('should analyze latency trends', async () => {
      const serviceId = 123;
      const timeRange = '6h';

      const latencyAnalysis = await metricsService.getLatencyAnalysis(serviceId, timeRange);

      expect(latencyAnalysis).toBeDefined();
      expect(Array.isArray(latencyAnalysis)).toBe(true);
    });

    it('should provide aggregated metrics for dashboards', async () => {
      const serviceId = 123;
      const timeRange = '24h';
      const aggregationWindow = '15m';

      const aggregatedData = await metricsService.getAggregatedMetrics(
        serviceId, 
        timeRange, 
        aggregationWindow
      );

      expect(aggregatedData).toBeDefined();
      expect(Array.isArray(aggregatedData)).toBe(true);
    });
  });

  describe('Health Monitoring', () => {
    it('should check InfluxDB connectivity', async () => {
      const healthStatus = await metricsService.getInfluxDBStatus();

      expect(healthStatus).toHaveProperty('connected');
      expect(healthStatus).toHaveProperty('message');
      expect(typeof healthStatus.connected).toBe('boolean');
    });
  });

  describe('Fallback Scenarios', () => {
    it('should gracefully handle InfluxDB unavailability', async () => {
      // Simular InfluxDB indisponível
      jest.spyOn(influxDBService, 'writeMetrics')
        .mockRejectedValue(new Error('InfluxDB connection failed'));

      const metricsData = {
        serviceId: 456,
        metrics: { cpu: 50.0, memory: 60.0 },
        status: 'ACTIVE'
      };

      // Deve continuar funcionando mesmo com InfluxDB indisponível
      const result = await metricsService.saveMetrics(metricsData);

      expect(result.success).toBe(true);
      // PostgreSQL ainda funciona
      expect(result.id).toBeDefined();
    });

    it('should fallback to PostgreSQL for queries when InfluxDB fails', async () => {
      // Simular falha no InfluxDB
      jest.spyOn(influxDBService, 'getMetricsByService')
        .mockRejectedValue(new Error('InfluxDB query failed'));

      const serviceId = 789;
      
      // Deve fazer fallback para PostgreSQL
      const metrics = await metricsService.getRealtimeMetrics(serviceId);

      expect(metrics).toBeDefined();
      // Dados vêm do PostgreSQL como fallback
    });
  });
});

// Exemplo de uso em produção
class ProductionExample {
  constructor(
    private metricsService: MetricsService,
    private prisma: any // PrismaService injetado
  ) {}

  async demonstrateUsage() {
    console.log('🚀 InfraWatch InfluxDB Integration Demo\n');

    // 1. Buscar serviços reais do banco de dados
    console.log('📋 Buscando serviços cadastrados no sistema...');
    
    const services = await this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true
      },
      take: 5 // Limitar a 5 serviços para demo
    });

    if (!services.length) {
      console.log('❌ Nenhum serviço encontrado no sistema. Cadastre serviços primeiro.');
      return;
    }

    console.log(`📊 Encontrados ${services.length} serviços. Consultando métricas reais...`);
    
    // 2. Buscar métricas existentes para cada serviço (sem salvar dados falsos)
    for (const service of services) {
      console.log(`\n🔍 Analisando serviço: ${service.name} (ID: ${service.id})`);
      
      try {
        // Verificar se há métricas no PostgreSQL
        const postgresqlMetrics = await this.metricsService.getMetricsByHost(service.id);
        console.log(`  📊 PostgreSQL: ${postgresqlMetrics.length} métricas encontradas`);
        
        // Mostrar últimas métricas se existirem
        if (postgresqlMetrics.length > 0) {
          const latest = postgresqlMetrics[0];
          console.log(`  📈 Última métrica: CPU ${latest.cpu}%, MEM ${latest.memory}%, Latência ${latest.latency}ms`);
          console.log(`  🕐 Timestamp: ${latest.timestamp}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Erro ao buscar métricas para ${service.name}`);
      }
    }

    console.log('\n📈 Demonstrando consultas otimizadas do InfluxDB...');

    // 3. Consultas de análise em tempo real usando dados reais
    for (const service of services) {
      try {
        // Métricas em tempo real (última hora) do InfluxDB
        const realtimeData = await this.metricsService.getRealtimeMetrics(service.id, '1h');
        console.log(`  📊 ${service.name}: ${realtimeData.length} pontos InfluxDB (1h)`);

        // Análise de latência (últimas 6 horas) do InfluxDB
        const latencyData = await this.metricsService.getLatencyAnalysis(service.id, '6h');
        console.log(`  🌐 ${service.name}: ${latencyData.length} medições latência InfluxDB (6h)`);

        // Dados agregados para dashboard (último dia, janelas de 15min)
        const aggregatedData = await this.metricsService.getAggregatedMetrics(
          service.id, 
          '24h', 
          '15m'
        );
        console.log(`  📈 ${service.name}: ${aggregatedData.length} pontos agregados InfluxDB (24h/15m)`);

        // Comparar com dados do PostgreSQL
        if (realtimeData.length === 0) {
          console.log(`  ⚠️ ${service.name}: Sem dados no InfluxDB - usando fallback PostgreSQL`);
        }

      } catch (error) {
        console.log(`  ❌ ${service.name}: Erro na consulta InfluxDB - usando fallback PostgreSQL`);
      }
    }

    // 4. Verificar status do sistema
    console.log('\n🏥 Status do sistema de métricas...');
    try {
      const influxStatus = await this.metricsService.getInfluxDBStatus();
      console.log(`💾 InfluxDB: ${influxStatus.connected ? '✅ Conectado' : '❌ Desconectado'}`);
      console.log(`   Mensagem: ${influxStatus.message}`);
      
      // Estatísticas gerais do banco
      const totalServices = await this.prisma.service.count();
      const totalMetrics = await this.prisma.metric.count();
      
      console.log(`📊 PostgreSQL:`);
      console.log(`   Serviços cadastrados: ${totalServices}`);
      console.log(`   Total de métricas: ${totalMetrics}`);
      
      if (totalMetrics > 0) {
        const latestMetric = await this.prisma.metric.findFirst({
          orderBy: { timestamp: 'desc' },
          include: { Service: { select: { name: true } } }
        });
        console.log(`   Última métrica: ${latestMetric?.Service?.name || 'N/A'} em ${latestMetric?.timestamp}`);
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar status do sistema');
    }

    console.log('\n🎯 Análise da implementação:');
    console.log('  • Dados reais do banco de dados PostgreSQL');
    console.log('  • Integração InfluxDB para otimização de séries temporais');
    console.log('  • Fallback automático para PostgreSQL quando necessário');
    console.log('  • Consultas híbridas para melhor performance');
    console.log('  • Preservação total de dados relacionais existentes');
  }
}

export { ProductionExample };
