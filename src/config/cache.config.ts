import { registerAs } from '@nestjs/config';

export const CacheConfigName = 'cache';

export interface CacheConfig {
  redisHost: string;
  redisPort: number;
  redisPassword: string;
  redisTtl: number;
}

export default registerAs(CacheConfigName, () => ({
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisTtl: parseInt(process.env.REDIS_TTL || '300'),
}));