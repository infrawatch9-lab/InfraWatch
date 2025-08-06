import { Router } from 'express';
import { MetricsController } from './metrics.controller';
import { authenticateTokenAgent } from '../auth/jwt.service';

export const metricsRouter = Router();

metricsRouter.post('/metrics', authenticateTokenAgent, async (req, res) =>
  MetricsController.receiveMetrics(req, res)
);

metricsRouter.get('/metrics/:host', authenticateTokenAgent, async (req, res) => {
  MetricsController.getMetricsByHost(req, res);
});

metricsRouter.get('/metrics', authenticateTokenAgent, async (req, res) => {
  MetricsController.getAllMetrics(req, res);
});

export const MetricsModule = {
  router: metricsRouter,
  controller: MetricsController,
  middlewares: {
    authenticateTokenAgent,
  },
};