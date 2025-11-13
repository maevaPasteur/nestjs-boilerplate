import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import IORedis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';

export interface RedisMemoryStats {
  usedMemory: string;
  usedMemoryPeak: string;
  totalKeys: number;
  memoryUsagePercentage: number;
  isHealthy: boolean;
}

@Injectable()
export class RedisHealthService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisHealthService.name);
  private readonly maxMemoryBytes = this.parseMemoryString(
    process.env.REDIS_MAX_MEMORY || '256mb'
  );

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
  ) {}

  /**
   * Check Redis memory every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkMemoryUsage(): Promise<void> {
    try {
      const stats = await this.getMemoryStats();

      this.logger.log(
        `📊 Redis Stats: Memory: ${stats.usedMemory}/${stats.usedMemoryPeak} | ` +
        `Keys: ${stats.totalKeys} | Usage: ${stats.memoryUsagePercentage.toFixed(1)}%`
      );

      // Alertes selon le niveau d'usage
      if (stats.memoryUsagePercentage > 90) {
        this.logger.error('🚨 Redis memory usage CRITICAL (>90%)');
        await this.handleCriticalMemory(stats);
      } else if (stats.memoryUsagePercentage > 80) {
        this.logger.warn('⚠️ Redis memory usage HIGH (>80%)');
        await this.handleHighMemory(stats);
      } else if (stats.memoryUsagePercentage > 70) {
        this.logger.warn('📈 Redis memory usage elevated (>70%)');
      }
    } catch (error) {
      this.logger.error('Failed to check Redis memory:', error);
    }
  }

  /**
   * Get current memory statistics
   */
  async getMemoryStats(): Promise<RedisMemoryStats> {
    const info = await this.redis.info('memory');
    const lines = info.split('\r\n');

    const usedMemory = this.extractValue(lines, 'used_memory_human');
    const usedMemoryBytes = parseInt(this.extractValue(lines, 'used_memory'));
    const peakMemory = this.extractValue(lines, 'used_memory_peak_human');
    const totalKeys = await this.redis.dbsize();

    const memoryUsagePercentage = (usedMemoryBytes / this.maxMemoryBytes) * 100;

    return {
      usedMemory,
      usedMemoryPeak: peakMemory,
      totalKeys,
      memoryUsagePercentage,
      isHealthy: memoryUsagePercentage < 80,
    };
  }

  /**
   * Get top keys by memory usage (for debugging)
   */
  async getTopKeysByMemory(limit = 10): Promise<Array<{ key: string; size: number }>> {
    const keys = await this.redis.keys('*');
    const keySizes: Array<{ key: string; size: number }> = [];

    // Sample keys to avoid performance issues
    const sampleSize = Math.min(keys.length, 100);
    const sampledKeys = keys.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

    for (const key of sampledKeys) {
      try {
        const size = await this.redis.memory('USAGE', key);
        keySizes.push({ key, size: size || 0 });
      } catch (error) {
        // Key might have been deleted
      }
    }

    return keySizes
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  /**
   * Clean expired keys manually (if needed)
   */
  async cleanExpiredKeys(): Promise<number> {
    const startKeys = await this.redis.dbsize();

    // Force Redis to clean expired keys
    await this.redis.eval(
      `return redis.call('dbsize')`,
      0
    );

    const endKeys = await this.redis.dbsize();
    const cleaned = startKeys - endKeys;

    if (cleaned > 0) {
      this.logger.log(`🧹 Cleaned ${cleaned} expired keys`);
    }

    return cleaned;
  }

  /**
   * Handle critical memory situation
   */
  private async handleCriticalMemory(stats: RedisMemoryStats): Promise<void> {
    // 1. Log les plus grosses clés
    const topKeys = await this.getTopKeysByMemory(5);
    this.logger.error('Top memory consumers:', topKeys);

    // 2. Nettoyer les clés expirées
    await this.cleanExpiredKeys();

    // 3. Envoyer une alerte (intégrez votre système d'alerting)
    // await this.sendAlert('Redis memory critical', stats);

    // 4. Optionnel : Purger certains caches non critiques
    // await this.redis.del('cache:non-critical:*');
  }

  /**
   * Handle high memory situation
   */
  private async handleHighMemory(stats: RedisMemoryStats): Promise<void> {
    // Nettoyer les clés expirées
    await this.cleanExpiredKeys();

    // Logger un warning avec les stats
    this.logger.warn('Consider increasing Redis memory limit or reviewing cache strategy');
  }

  /**
   * Health check endpoint data
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    stats: RedisMemoryStats;
  }> {
    try {
      const stats = await this.getMemoryStats();

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (stats.memoryUsagePercentage < 70) {
        status = 'healthy';
      } else if (stats.memoryUsagePercentage < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, stats };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        stats: {
          usedMemory: '0',
          usedMemoryPeak: '0',
          totalKeys: 0,
          memoryUsagePercentage: 0,
          isHealthy: false,
        },
      };
    }
  }

  /**
   * Parse memory string (e.g., "256mb" to bytes)
   */
  private parseMemoryString(memory: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const regex = /^(\d+)(b|kb|mb|gb)?$/i;
    const match = memory.toLowerCase().match(regex);

    if (!match) {
      return 256 * 1024 * 1024; // Default 256MB
    }

    const value = parseInt(match[1]);
    const unit = match[2] || 'b';

    return value * units[unit];
  }

  /**
   * Extract value from Redis INFO output
   */
  private extractValue(lines: string[], key: string): string {
    const line = lines.find(l => l.startsWith(key + ':'));
    return line?.split(':')[1]?.trim() || '0';
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    this.redis.disconnect();
  }
}