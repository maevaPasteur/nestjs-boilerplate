import { Module, Global, DynamicModule } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { CacheService } from './services/cache.service';
import { CacheKeyBuilder } from './services/cache-key-builder.service';
import { CacheMetricsService } from './services/cache-metrics.service';

@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    /*
    // Without Redis
    return {
      module: CacheModule,
      imports: [
        NestCacheModule.register({
          ttl: 300,
        }),
      ],
      providers: [CacheService, CacheKeyBuilder, CacheMetricsService],
      exports: [NestCacheModule, CacheService, CacheKeyBuilder, CacheMetricsService],
    };
     */
    return {
      module: CacheModule,
      imports: [
        NestCacheModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const cacheConfig = configService.get('cache');
            return {
              store: redisStore,
              host: cacheConfig.redis.host,
              port: cacheConfig.redis.port,
              password: cacheConfig.redis.password,
              db: cacheConfig.redis.db,
              ttl: cacheConfig.defaults.ttl,
              keyPrefix: cacheConfig.redis.keyPrefix,
              retryStrategy: (times: number) => {
                if (times > 3) {
                  return null;
                }
                return Math.min(times * 100, 3000);
              },
            };
          },
        }),
      ],
      providers: [
        CacheService,
        CacheKeyBuilder,
        CacheMetricsService,
      ],
      exports: [
        NestCacheModule,
        CacheService,
        CacheKeyBuilder,
        CacheMetricsService,
      ],
    };
  }
}