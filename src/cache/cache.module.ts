import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { Cacheable } from 'cacheable';
import { createKeyv } from '@keyv/redis';
import { CacheService } from './cache.service';
import cacheConfig from '../config/cache.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(cacheConfig)],
  providers: [
    {
      provide: 'KEYV_CACHE_INSTANCE',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const cacheOptions =
          configService.get<ConfigType<typeof cacheConfig>>('cache');

        if (!cacheOptions) {
          throw new Error('Cache configuration missing');
        }

        const redisUrl = `redis://${cacheOptions.password ? `:${cacheOptions.password}@` : ''}${cacheOptions.host}:${cacheOptions.port}/${cacheOptions.db}`;

        // Create Keyv Redis adapter
        const kv = createKeyv(redisUrl, {
          throwOnErrors: false,
        });

        // Create Cacheable instance with Redis as kv storage
        const cache = new Cacheable({
          secondary: kv,
          ttl: `${cacheOptions.defaultTtl}`,
        });

        // Test connection
        await kv.set('__healthcheck__', 'ok', 5_000); // 5 seconds
        const result = await kv.get<string>('__healthcheck__');

        if (result === 'ok') {
          logger.log('✅ Redis cache connection established successfully');
          await kv.delete('__healthcheck__');
        } else {
          logger.error('❌ Redis cache connection error');
        }

        return cache;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: ['KEYV_CACHE_INSTANCE', CacheService],
})
export class CacheModule { }
