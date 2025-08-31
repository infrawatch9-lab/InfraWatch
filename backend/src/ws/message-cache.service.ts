import { Injectable } from '@nestjs/common';

export interface MessageCacheEntry {
  timestamp: number;
  data?: any;
}

@Injectable()
export class MessageCacheService {
  private processedMessages: Map<string, MessageCacheEntry> = new Map();
  private readonly MESSAGE_CACHE_TTL = 10000; // 10 segundos
  private readonly CLEANUP_INTERVAL = 30000; // 30 segundos

  constructor() {
    // Limpar cache de mensagens processadas automaticamente
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Gera uma chave única para identificar mensagens
   */
  generateMessageKey(from: string, serviceId: string | number, status: string, timestamp?: string | number): string {
    const ts = timestamp || Date.now();
    return `${from}-${serviceId}-${status}-${ts}`;
  }

  /**
   * Verifica se uma mensagem já foi processada recentemente
   */
  isMessageProcessed(messageKey: string): boolean {
    return this.processedMessages.has(messageKey);
  }

  /**
   * Marca uma mensagem como processada
   */
  markMessageAsProcessed(messageKey: string, data?: any): void {
    this.processedMessages.set(messageKey, {
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Remove mensagens expiradas do cache
   */
  private cleanupExpiredMessages(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.processedMessages.entries()) {
      if (now - entry.timestamp > this.MESSAGE_CACHE_TTL) {
        this.processedMessages.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache de mensagens: ${cleanedCount} entradas expiradas removidas`);
    }
  }

  /**
   * Limpa todo o cache manualmente
   */
  clearCache(): number {
    const clearedCount = this.processedMessages.size;
    this.processedMessages.clear();
    console.log(`🧹 Cache de mensagens limpo: ${clearedCount} entradas removidas`);
    return clearedCount;
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.processedMessages.entries());

    return {
      totalEntries: entries.length,
      ttlSeconds: this.MESSAGE_CACHE_TTL / 1000,
      cleanupIntervalSeconds: this.CLEANUP_INTERVAL / 1000,
      entries: entries.map(([key, entry]) => ({
        key,
        timestamp: new Date(entry.timestamp).toISOString(),
        ageInSeconds: Math.floor((now - entry.timestamp) / 1000),
        isExpired: (now - entry.timestamp) > this.MESSAGE_CACHE_TTL
      })),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([, entry]) => entry.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([, entry]) => entry.timestamp)) : null
    };
  }

  /**
   * Obtém uma entrada específica do cache
   */
  getCacheEntry(messageKey: string): MessageCacheEntry | null {
    return this.processedMessages.get(messageKey) || null;
  }

  /**
   * Remove uma entrada específica do cache
   */
  removeCacheEntry(messageKey: string): boolean {
    return this.processedMessages.delete(messageKey);
  }

  /**
   * Verifica se o cache está cheio (para alertas)
   */
  isCacheFull(threshold: number = 1000): boolean {
    return this.processedMessages.size > threshold;
  }
}
