import { Service } from '@prisma/client';

const activeMonitors = new Map<number, NodeJS.Timeout>();

export function startMonitor(service: Service, handler: { start: (svc: Service) => Promise<void> }) {
  stopMonitor(service.id); // evita duplicados

  // Debug: vamos ver o que tem na configuração
  console.log(`🔍 Debug service configs for ${service.name}:`, JSON.stringify((service as any).configs, null, 2));
  
  const intervalMs = (service as any)?.configs?.[0]?.interval * 1000 || 60_000;
  console.log(`🚀 Starting monitor for service ${service.name} (ID: ${service.id}) with interval ${intervalMs/1000}s`);
  console.log(`📊 Raw interval from config: ${(service as any)?.configs?.[0]?.interval}`);
  
  // Executa imediatamente a primeira verificação
  handler.start(service).catch(error => {
    console.error(`❌ Error in immediate monitor execution for service ${service.id}:`, error);
  });
  
  // Depois agenda as próximas execuções
  const timer = setInterval(async () => {
    try {
      await handler.start(service);
    } catch (error) {
      console.error(`❌ Error in scheduled monitor execution for service ${service.id}:`, error);
    }
  }, intervalMs);

  activeMonitors.set(service.id, timer);
  console.log(`✅ Monitor scheduled for service ${service.name} (ID: ${service.id})`);
}

export function stopMonitor(serviceId: number) {
  const timer = activeMonitors.get(serviceId);
  if (timer) {
    clearInterval(timer);
    activeMonitors.delete(serviceId);
    console.log(`🛑 Stopped monitor for service ID: ${serviceId}`);
  }
}

export function restartMonitor(
  service: Service,
  handler: { start: (svc: Service) => Promise<void> }
) {
  stopMonitor(service.id);
  startMonitor(service, handler);
}
