import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthDashboardService } from './health.service';
import { RedisHealthService } from '../cache/services/redis-health.service';
import { CacheModule } from '../cache/cache.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    CacheModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthDashboardService,
    RedisHealthService,
  ],
  exports: [
    HealthDashboardService,
    RedisHealthService,
  ],
})
export class HealthModule {}