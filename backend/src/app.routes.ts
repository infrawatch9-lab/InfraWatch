import { Router } from "express";
import { UsersModule } from "./users/users.module";
import { metricsRouter } from "./metrics/metrics.module";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "InfraWatch API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

router.use("/users", UsersModule.router);
router.use("/metrics", metricsRouter);

// Placeholder para outros módulos
// router.use("/services", servicesRouter);
// router.use("/teams", teamsRouter);
// router.use("/alerts", alertsRouter);
// router.use("/notifications", notificationsRouter);
// router.use("/sla", slaRouter);

router.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    endpoint: req.originalUrl,
  });
});

export default router;
