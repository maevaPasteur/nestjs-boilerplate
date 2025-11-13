import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redis = new IORedis({
          host: configService.get('cache.redis.host'),
          port: configService.get('cache.redis.port'),
          password: configService.get('cache.redis.password'),
          db: configService.get('cache.redis.db'),
          keyPrefix: configService.get('cache.redis.keyPrefix'),
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 100, 3000);
          },
        });

        redis.on('connect', () => {
          console.log('✅ Redis connected');
        });

        redis.on('error', (err) => {
          console.error('❌ Redis error:', err);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}