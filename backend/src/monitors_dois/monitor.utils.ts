import { Service } from '@prisma/client';

const activeMonitors = new Map<number, NodeJS.Timeout>();

export function startMonitor(service: Service, handler: { start: (svc: Service) => Promise<void> }) {
  stopMonitor(service.id); // evita duplicados

  const intervalMs = (service as any)?.configs?.[0]?.interval * 1000 || 60_000;
  const timer = setInterval(async () => {
    await handler.start(service);
  }, intervalMs);

  activeMonitors.set(service.id, timer);
}

export function stopMonitor(serviceId: number) {
  const timer = activeMonitors.get(serviceId);
  if (timer) {
    clearInterval(timer);
    activeMonitors.delete(serviceId);
  }
}

export function restartMonitor(
  service: Service,
  handler: { start: (svc: Service) => Promise<void> }
) {
  stopMonitor(service.id);
  startMonitor(service, handler);
}
