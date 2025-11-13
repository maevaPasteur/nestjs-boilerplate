import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseFactory } from './setup/database.factory';
import authConfig from "./config/auth.config";
import cacheConfig from "./config/cache.config";
import cloudinaryConfig from "./config/cloudinary.config";
import databaseConfig from "./config/database.config";
import serverConfig from "./config/server.config";
import { CacheModule } from './infrastructure/cache/cache.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './infrastructure/health/health.module';
import { SmartCacheInterceptor } from "./infrastructure/cache/interceptors/cache.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        authConfig,
        cacheConfig,
        cloudinaryConfig,
        databaseConfig,
        serverConfig,
      ],
      cache: true,
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseFactory,
    }),
    ScheduleModule.forRoot(),
    CacheModule.forRoot(),
    RedisModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SmartCacheInterceptor,
    },
  ],
})
export class AppModule {}

function getEnvFilePath() {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}