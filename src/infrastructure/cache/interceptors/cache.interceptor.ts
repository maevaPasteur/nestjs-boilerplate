import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CacheKeyBuilder } from '../services/cache-key-builder.service';
import { ms } from "../../../common/utils/time.util";
import { NO_CACHE_KEY } from '../../../common/decorators/no-cache.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SmartCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly keyBuilder: CacheKeyBuilder,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (noCache) {
      return next.handle();
    }

    if (request.method !== 'GET') {
      return next.handle();
    }

    if (request.user?.role === 'admin' && request.headers['cache-control'] === 'no-cache') {
      return next.handle();
    }

    const cacheKey = this.keyBuilder.build(
      'http',
      request.url,
      this.keyBuilder.hash(request.query),
    );

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (response) => {
        const ttl = this.determineTTL(request.url);
        await this.cacheService.set(cacheKey, response, { ttl });
      }),
    );
  }

  private determineTTL(url: string): number {
    if (url.includes('/users')) return ms.minutes(1);
    return ms.minutes(5)
  }
}