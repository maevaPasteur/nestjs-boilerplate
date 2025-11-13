import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CacheMetricsService } from './cache-metrics.service';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly tagStore = new Map<string, Set<string>>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly metrics: CacheMetricsService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const value = await this.cacheManager.get<T>(key);

      if (value !== null && value !== undefined) {
        this.metrics.recordHit(Date.now() - startTime);
        this.logger.debug(`Cache HIT for key: ${key}`);
        return value;
      }

      this.metrics.recordMiss();
      this.logger.debug(`Cache MISS for key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      this.metrics.recordError();
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const { ttl, tags = [], version } = options;

      const valueToCache = version
        ? { data: value, version, cachedAt: Date.now() }
        : value;

      await this.cacheManager.set(key, valueToCache, ttl);

      if (tags.length > 0) {
        this.storeTags(key, tags);
      }

      this.logger.debug(`Cache SET for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
      this.metrics.recordError();
    }
  }

  async delete(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      await Promise.all(keys.map(k => this.cacheManager.del(k)));

      // Clean up tags
      keys.forEach(k => this.removeTags(k));

      this.logger.debug(`Cache DELETE for keys: ${keys.join(', ')}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error:`, error);
      this.metrics.recordError();
    }
  }

  /**
   * Get or set cache with factory function (Cache-Aside Pattern)
   */
  async remember<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute factory and cache the result
    try {
      const value = await factory();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      this.logger.error(`Factory function error for key ${key}:`, error);
      throw error;
    }
  }

  async invalidateTags(tags: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>();

    tags.forEach(tag => {
      const keys = this.tagStore.get(tag);
      if (keys) {
        keys.forEach(key => keysToInvalidate.add(key));
        this.tagStore.delete(tag);
      }
    });

    if (keysToInvalidate.size > 0) {
      await this.delete(Array.from(keysToInvalidate));
      this.logger.debug(`Invalidated ${keysToInvalidate.size} keys for tags: ${tags.join(', ')}`);
    }
  }

  async flush(): Promise<void> {
    try {
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else {
        this.logger.warn('Cache flush not supported by current store');
      }
      this.tagStore.clear();
      this.logger.warn('Cache FLUSHED - All cache cleared');
    } catch (error) {
      this.logger.error('Cache FLUSH error:', error);
      this.metrics.recordError();
    }
  }

  wrap<T>(
    keyPattern: string,
    fn: (...args: any[]) => Promise<T>,
    options: CacheOptions = {},
  ) {
    return async (...args: any[]): Promise<T> => {
      const key = this.buildKey(keyPattern, ...args);
      return this.remember(key, () => fn(...args), options);
    };
  }

  private buildKey(pattern: string, ...args: any[]): string {
    return pattern.replace(/{(\d+)}/g, (match, index) => {
      return String(args[parseInt(index)]);
    });
  }

  private storeTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagStore.has(tag)) {
        this.tagStore.set(tag, new Set());
      }
      this.tagStore.get(tag)!.add(key);
    });
  }

  private removeTags(key: string): void {
    this.tagStore.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagStore.delete(tag);
      }
    });
  }
}