package com.anand.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis template configuration for direct Redis operations.
 * <p>
 * Provides a configured RedisTemplate bean for performing
 * low-level Redis operations, particularly for token blacklisting.
 * 
 * @author Your Team Name
 * @version 1.0
 * @since 2025-12-29
 */
@Configuration
public class RedisConfig {
    
    /**
     * Configures RedisTemplate for string-based key-value operations.
     * <p>
     * Used primarily for JWT token blacklisting and revocation management.
     *
     * @param connectionFactory the Redis connection factory
     * @return configured RedisTemplate instance
     */
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        StringRedisSerializer serializer = new StringRedisSerializer();
        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(serializer);
        template.setHashValueSerializer(serializer);
        
        template.afterPropertiesSet();
        return template;
    }
}
