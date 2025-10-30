import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

function getEnvFilePath() {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}