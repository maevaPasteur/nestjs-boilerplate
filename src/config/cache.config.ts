import { registerAs } from '@nestjs/config';

export const CacheConfigName = 'cache';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  },
  defaults: {
    ttl: number;
    max: number;
  };
}

export default registerAs(CacheConfigName, () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '300'),
  },
  defaults: {
    ttl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },
}));