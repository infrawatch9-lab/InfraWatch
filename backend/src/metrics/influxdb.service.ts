import { Injectable, Logger } from '@nestjs/common';
import { InfluxDB, Point, WriteApi, QueryApi } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDBService {
  private readonly logger = new Logger(InfluxDBService.name);
  private influxDB!: InfluxDB;
  private writeApi!: WriteApi;
  private queryApi!: QueryApi;
  
  private readonly url = process.env.INFLUXDB_URL || 'http://localhost:8086';
  private readonly token = process.env.INFLUXDB_TOKEN || 'your-influxdb-token';
  private readonly org = process.env.INFLUXDB_ORG || 'infrawatch';
  private readonly bucket = process.env.INFLUXDB_BUCKET || 'metrics';

  constructor() {
    this.initializeInfluxDB();
  }

  private initializeInfluxDB() {
    try {
      this.influxDB = new InfluxDB({
        url: this.url,
        token: this.token,
      });

      this.writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
      this.writeApi.useDefaultTags({ application: 'infrawatch' });

      this.queryApi = this.influxDB.getQueryApi(this.org);

      this.logger.log(`✅ InfluxDB connected: ${this.url}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize InfluxDB:', error);
      throw error;
    }
  }

  async writeMetrics(data: {
    serviceId: number;
    timestamp?: Date;
    cpu?: number;
    memory?: number;
    latency?: number;
    disk?: number;
    networkIn?: number;
    networkOut?: number;
    status?: string;
    host?: string;
  }): Promise<void> {
    try {
      const timestamp = data.timestamp || new Date();
      
      // Criar ponto principal de métricas do sistema
      const systemPoint = new Point('system_metrics')
        .tag('service_id', data.serviceId.toString())
        .tag('host', data.host || 'unknown')
        .tag('status', data.status || 'PENDING')
        .timestamp(timestamp);

      // Adicionar campos numéricos se disponíveis
      if (data.cpu !== undefined) systemPoint.floatField('cpu', data.cpu);
      if (data.memory !== undefined) systemPoint.floatField('memory', data.memory);
      if (data.disk !== undefined) systemPoint.floatField('disk', data.disk);
      if (data.networkIn !== undefined) systemPoint.floatField('network_in', data.networkIn);
      if (data.networkOut !== undefined) systemPoint.floatField('network_out', data.networkOut);

      this.writeApi.writePoint(systemPoint);

      // Criar ponto separado para latência se disponível
      if (data.latency !== undefined) {
        const latencyPoint = new Point('network_latency')
          .tag('service_id', data.serviceId.toString())
          .tag('host', data.host || 'unknown')
          .tag('target', '8.8.8.8')
          .floatField('response_time_ms', data.latency)
          .timestamp(timestamp);

        this.writeApi.writePoint(latencyPoint);
      }

      await this.writeApi.flush();
      this.logger.debug(`📊 Metrics written to InfluxDB for service ${data.serviceId}`);
    } catch (error) {
      this.logger.error('❌ Error writing metrics to InfluxDB:', error);
      throw error;
    }
  }

  async getMetricsByService(
    serviceId: number,
    timeRange: string = '1h',
    limit: number = 1000
  ): Promise<any[]> {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "system_metrics")
          |> filter(fn: (r) => r.service_id == "${serviceId}")
          |> sort(columns: ["_time"], desc: true)
          |> limit(n: ${limit})
      `;

      const results: any[] = [];
      
      return new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next: (row, tableMeta) => {
            const record = tableMeta.toObject(row);
            results.push(record);
          },
          error: (error) => {
            this.logger.error('❌ Error querying InfluxDB:', error);
            reject(error);
          },
          complete: () => {
            this.logger.debug(`📈 Retrieved ${results.length} metrics for service ${serviceId}`);
            resolve(results);
          },
        });
      });
    } catch (error) {
      this.logger.error('❌ Error querying metrics from InfluxDB:', error);
      throw error;
    }
  }

  async getLatencyMetrics(
    serviceId: number,
    timeRange: string = '1h'
  ): Promise<any[]> {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "network_latency")
          |> filter(fn: (r) => r.service_id == "${serviceId}")
          |> sort(columns: ["_time"], desc: true)
      `;

      const results: any[] = [];
      
      return new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next: (row, tableMeta) => {
            const record = tableMeta.toObject(row);
            results.push(record);
          },
          error: (error) => {
            this.logger.error('❌ Error querying latency from InfluxDB:', error);
            reject(error);
          },
          complete: () => {
            this.logger.debug(`🌐 Retrieved ${results.length} latency metrics for service ${serviceId}`);
            resolve(results);
          },
        });
      });
    } catch (error) {
      this.logger.error('❌ Error querying latency metrics from InfluxDB:', error);
      throw error;
    }
  }

  async getAggregatedMetrics(
    serviceId: number,
    timeRange: string = '1h',
    aggregationWindow: string = '5m'
  ): Promise<any[]> {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "system_metrics")
          |> filter(fn: (r) => r.service_id == "${serviceId}")
          |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
          |> yield(name: "mean")
      `;

      const results: any[] = [];
      
      return new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next: (row, tableMeta) => {
            const record = tableMeta.toObject(row);
            results.push(record);
          },
          error: (error) => {
            this.logger.error('❌ Error querying aggregated metrics from InfluxDB:', error);
            reject(error);
          },
          complete: () => {
            this.logger.debug(`📊 Retrieved ${results.length} aggregated metrics for service ${serviceId}`);
            resolve(results);
          },
        });
      });
    } catch (error) {
      this.logger.error('❌ Error querying aggregated metrics from InfluxDB:', error);
      throw error;
    }
  }

  async getHealthStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      // Teste simples de conectividade fazendo uma query básica
      const query = `buckets() |> limit(n:1)`;
      await this.queryApi.collectRows(query);
      return {
        connected: true,
        message: 'InfluxDB connection healthy'
      };
    } catch (error) {
      this.logger.error('❌ InfluxDB health check failed:', error);
      return {
        connected: false,
        message: `InfluxDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async onModuleDestroy() {
    try {
      await this.writeApi.close();
      this.logger.log('🔌 InfluxDB connection closed gracefully');
    } catch (error) {
      this.logger.error('❌ Error closing InfluxDB connection:', error);
    }
  }
}
