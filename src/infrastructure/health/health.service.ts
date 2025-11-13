import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisHealthService } from '../cache/services/redis-health.service';
import { CacheMetricsService } from '../cache/services/cache-metrics.service';

export interface DashboardData {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: any;
  cache: any;
  topMemoryKeys: any[];
  alerts: Alert[];
  recommendations: string[];
}

interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
}

@Injectable()
export class HealthDashboardService {
  private readonly logger = new Logger(HealthDashboardService.name);
  private alerts: Alert[] = [];

  constructor(
    private readonly redisHealth: RedisHealthService,
    private readonly cacheMetrics: CacheMetricsService,
  ) {}

  /**
   * Automatic monitoring every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async performHealthCheck() {
    const data = await this.getDashboardData();

    if (data.status !== 'healthy') {
      this.logger.warn(`System status: ${data.status}`, data.alerts);
    }

    if (data.status === 'unhealthy') {
      await this.handleUnhealthyState(data);
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const [redisStatus, cacheMetrics, topKeys] = await Promise.all([
      this.redisHealth.getHealthStatus(),
      this.cacheMetrics.getMetrics(),
      this.redisHealth.getTopKeysByMemory(5),
    ]);

    const alerts = this.generateAlerts(redisStatus.stats, cacheMetrics);
    const status = this.determineOverallStatus(alerts);
    const recommendations = this.generateRecommendations(redisStatus.stats, cacheMetrics);

    return {
      timestamp: new Date().toISOString(),
      status,
      redis: redisStatus,
      cache: cacheMetrics,
      topMemoryKeys: topKeys,
      alerts,
      recommendations,
    };
  }

  /**
   * Generate alerts from metrics
   */
  private generateAlerts(redisStats: any, cacheMetrics: any): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    // Redis memory alerts
    if (redisStats.memoryUsagePercentage > 90) {
      alerts.push({
        level: 'critical',
        message: `Redis memory usage critical: ${redisStats.memoryUsagePercentage.toFixed(1)}%`,
        timestamp: now,
      });
    } else if (redisStats.memoryUsagePercentage > 80) {
      alerts.push({
        level: 'warning',
        message: `Redis memory usage high: ${redisStats.memoryUsagePercentage.toFixed(1)}%`,
        timestamp: now,
      });
    }

    // Cache performance alerts
    if (cacheMetrics.hitRate < 50) {
      alerts.push({
        level: 'warning',
        message: `Low cache hit rate: ${cacheMetrics.hitRate.toFixed(1)}%`,
        timestamp: now,
      });
    }

    // Redis connexion
    if (!redisStats.isHealthy) {
      alerts.push({
        level: 'error',
        message: 'Redis connection unhealthy',
        timestamp: now,
      });
    }

    // High error rate
    if (cacheMetrics.errors > 100) {
      alerts.push({
        level: 'error',
        message: `High cache error count: ${cacheMetrics.errors}`,
        timestamp: now,
      });
    }

    return alerts;
  }

  /**
   * Détermine le statut global
   */
  private determineOverallStatus(alerts: Alert[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (alerts.some(a => a.level === 'critical')) {
      return 'unhealthy';
    }
    if (alerts.some(a => a.level === 'error' || a.level === 'warning')) {
      return 'degraded';
    }
    return 'healthy';
  }

  private generateRecommendations(redisStats: any, cacheMetrics: any): string[] {
    const recommendations: string[] = [];

    if (redisStats.memoryUsagePercentage > 70) {
      recommendations.push('Consider increasing Redis memory limit');
      recommendations.push('Review cache TTL settings for optimization');
    }

    if (cacheMetrics.hitRate < 70) {
      recommendations.push('Review cache key strategy');
      recommendations.push('Consider caching more frequently accessed data');
    }

    if (redisStats.totalKeys > 10000) {
      recommendations.push('High number of keys - consider implementing cache eviction policies');
    }

    if (cacheMetrics.averageResponseTime > 100) {
      recommendations.push('High cache response time - check Redis server performance');
    }

    return recommendations;
  }

  private async handleUnhealthyState(data: DashboardData) {
    this.logger.error('🚨 System in unhealthy state!', data.alerts);

    // Automatic actions
    if (data.redis.stats.memoryUsagePercentage > 95) {
      this.logger.warn('Attempting automatic cache cleanup...');
      await this.redisHealth.cleanExpiredKeys();
    }

    // Send alert (email, Slack, etc.)
    // await this.alertService.sendCriticalAlert(data);
  }

  getActiveAlerts(): Alert[] {
    // Garde seulement les alertes des dernières 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alerts.filter(a => new Date(a.timestamp) > oneDayAgo);
  }

  /**
   * Add manual alert
   */
  addAlert(level: Alert['level'], message: string) {
    this.alerts.push({
      level,
      message,
      timestamp: new Date().toISOString(),
    });

    // Keep max 100 alertes
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }
}