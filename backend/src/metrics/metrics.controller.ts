import { Request, Response } from 'express';
import { metricsService } from './metrics.service';
import { CreateMetricDto } from './metrics.entity';

export const MetricsController = {
  async receiveMetrics(req: Request, res: Response) {
    try {
      const data = req.body as CreateMetricDto;

      const result = await metricsService.saveMetrics(data);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getMetricsByHost(req: Request, res: Response) {
    try {
      const { host } = req.params;
      const metrics = await metricsService.getMetricsByHost(host);
      return res.status(200).json(metrics);
    } catch (error) {
      console.error('Erro ao buscar métricas por host:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getAllMetrics(req: Request, res: Response) {
    try {
      const metrics = await metricsService.getAllMetrics();
      return res.status(200).json(metrics);
    } catch (error) {
      console.error('Erro ao buscar todas as métricas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },
};
