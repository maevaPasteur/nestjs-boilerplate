import { Injectable } from '@nestjs/common';

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  averageResponseTime: number;
  lastReset: Date;
}

@Injectable()
export class CacheMetricsService {
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalResponseTime: 0,
    lastReset: new Date(),
  };

  recordHit(responseTime: number): void {
    this.metrics.hits++;
    this.metrics.totalResponseTime += responseTime;
  }

  recordMiss(): void {
    this.metrics.misses++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      averageResponseTime: this.metrics.hits > 0
        ? this.metrics.totalResponseTime / this.metrics.hits
        : 0,
      lastReset: this.metrics.lastReset,
    };
  }

  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalResponseTime: 0,
      lastReset: new Date(),
    };
  }
}