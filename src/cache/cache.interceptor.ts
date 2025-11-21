import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.get<string | number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    // Try to get from cache
    const cachedValue = await this.cacheService.get(cacheKey);
    if (cachedValue) {
      return of(cachedValue);
    }

    // If not in cache, execute handler and cache result
    return next.handle().pipe(
      tap((response) => {
        this.cacheService.set(cacheKey, response, { ttl }).catch(() => {});
      }),
    );
  }
}
