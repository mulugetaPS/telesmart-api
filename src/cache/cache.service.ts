import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cacheable } from 'cacheable';
import { CacheOptions } from 'src/common/types/cache.type';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject('KEYV_CACHE_INSTANCE') private readonly cache: Cacheable,
  ) { }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get(key);

    if (value !== undefined) {
      this.logger.debug(`Cache HIT for key: ${key}`);
      return value as T;
    }

    this.logger.debug(`Cache MISS for key: ${key}`);
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    await this.cache.set(key, value, options?.ttl);
    this.logger.debug(
      `Cache SET for key: ${key}, TTL: ${options?.ttl || 'default'}`,
    );
    return true;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    await this.cache.delete(key);
    this.logger.debug(`Cache DELETE for key: ${key}`);
    return true;
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const value = await this.cache.get(key);
    return value !== undefined;
  }

  /**
   * Set value only if key doesn't exist (atomic operation for distributed locking)
   */
  async setIfNotExists<T>(
    key: string,
    value: T,
    ttlMs?: number,
  ): Promise<boolean> {
    try {
      // Check if key already exists
      const existing = await this.cache.get(key);
      if (existing !== undefined) {
        this.logger.debug(`Cache SETNX FAILED for key: ${key} - key exists`);
        return false;
      }

      // Set the value with TTL
      await this.cache.set(key, value, ttlMs);
      this.logger.debug(
        `Cache SETNX SUCCESS for key: ${key}, TTL: ${ttlMs || 'default'}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Cache SETNX ERROR for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - if key doesn't exist, execute callback and cache result
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cachedValue = await this.get<T>(key);
    if (cachedValue !== null && cachedValue !== undefined) {
      return cachedValue;
    }

    // Execute callback and cache result
    const value = await callback();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<boolean> {
    await this.cache.clear();
    this.logger.warn('Cache CLEARED - all keys deleted');
    return true;
  }
}
