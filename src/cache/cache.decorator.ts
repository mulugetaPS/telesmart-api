import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: string | number) =>
  SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Cache decorator that combines key and TTL
 */
export function Cache(key: string, ttl?: string | number) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
  };
}
