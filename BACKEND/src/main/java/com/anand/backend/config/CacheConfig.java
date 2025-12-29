package com.anand.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis cache configuration for distributed caching.
 * <p>
 * Configures RedisCacheManager with multiple cache regions, each having
 * specific TTL (Time-To-Live) settings optimized for their use cases.
 * Utilizes Redis as an in-memory data store for high-performance caching.
 * 
 * @author Your Team Name
 * @version 1.0
 * @since 2025-12-29
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * Configures the Redis cache manager with custom cache regions.
     * <p>
     * Cache regions:
     * <ul>
     *   <li><b>userAccess</b>: User video access permissions (TTL: 5 minutes)</li>
     *   <li><b>videoMetadata</b>: Video metadata and details (TTL: 15 minutes)</li>
     *   <li><b>tokenBlacklist</b>: Revoked JWT tokens (TTL: 1 hour)</li>
     * </ul>
     *
     * @param connectionFactory the Redis connection factory
     * @return configured cache manager instance
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()
                )
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()
                )
            )
            .disableCachingNullValues();
        
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        
        cacheConfigs.put("userAccess", 
            defaultConfig.entryTtl(Duration.ofMinutes(5))
        );
        
        cacheConfigs.put("videoMetadata", 
            defaultConfig.entryTtl(Duration.ofMinutes(15))
        );
        
        cacheConfigs.put("tokenBlacklist", 
            defaultConfig.entryTtl(Duration.ofHours(1))
        );
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }
}
