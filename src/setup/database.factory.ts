import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DatabaseConfig, DatabaseConfigName } from '../config/database.config';
import { ServerConfig, ServerConfigName } from '../config/server.config';

@Injectable()
export class DatabaseFactory implements TypeOrmOptionsFactory {
  private readonly logger = new Logger(DatabaseFactory.name);

  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig = this.configService.getOrThrow<DatabaseConfig>(DatabaseConfigName);
    const serverConfig = this.configService.getOrThrow<ServerConfig>(ServerConfigName);

    const { host, port, user, password, name, minPoolSize, maxPoolSize } = dbConfig;

    this.logger.debug(`Connecting to PostgreSQL at ${host}:${port}/${name}`);

    return {
      type: 'postgres',
      host,
      port: parseInt(port.toString()),
      username: user,
      password,
      database: name,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: serverConfig.nodeEnv !== 'production',
      logging: serverConfig.nodeEnv === 'development',
      migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      extra: {
        min: minPoolSize,
        max: maxPoolSize,
        connectionTimeoutMillis: 60000,
        idleTimeoutMillis: 45000,
      },
    };
  }
}