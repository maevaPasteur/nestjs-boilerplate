import { Controller, Get } from '@nestjs/common';
import { RedisHealthService } from '../cache/services/redis-health.service';
import { CacheMetricsService } from '../cache/services/cache-metrics.service';
import { HealthDashboardService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly redisHealthService: RedisHealthService,
    private readonly cacheMetricsService: CacheMetricsService,
    private readonly dashboardService: HealthDashboardService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  async redisHealth() {
    return this.redisHealthService.getHealthStatus();
  }

  @Get('cache/metrics')
  cacheMetrics() {
    return this.cacheMetricsService.getMetrics();
  }

  @Get('dashboard')
  async dashboard() {
    return this.dashboardService.getDashboardData();
  }

  @Get('cache/top-keys')
  async topKeys() {
    return this.redisHealthService.getTopKeysByMemory(10);
  }
}