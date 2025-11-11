import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseFactory } from './setup/database.factory';
import authConfig from "./config/auth.config";
import cacheConfig from "./config/cache.config";
import cloudinaryConfig from "./config/cloudinary.config";
import databaseConfig from "./config/database.config";
import serverConfig from "./config/server.config";

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
    UsersModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

function getEnvFilePath() {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}