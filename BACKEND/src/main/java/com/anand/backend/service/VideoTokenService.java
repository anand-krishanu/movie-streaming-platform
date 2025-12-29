package com.anand.backend.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * Service for generating and validating JWT tokens for HLS video streaming.
 * <p>
 * Provides token-based authorization for video segments independent of Firebase
 * user authentication. Implements short-lived tokens for master playlists and
 * individual video segments to prevent unauthorized access and URL sharing.
 * <p>
 * Token Types:
 * <ul>
 *   <li><b>Master Playlist Token</b>: Grants access to m3u8 playlist (10 min TTL)</li>
 *   <li><b>Segment Token</b>: Grants access to specific .ts segment (5 min TTL)</li>
 * </ul>
 * 
 * @author Your Team Name
 * @version 1.0
 * @since 2025-12-29
 */
@Service
public class VideoTokenService {
    
    private final SecretKey secretKey;
    private final long masterPlaylistExpiration;
    private final long segmentExpiration;
    private final RedisTemplate<String, String> redisTemplate;
    
    public VideoTokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.master-playlist.expiration}") long masterPlaylistExpiration,
            @Value("${jwt.segment.expiration}") long segmentExpiration,
            RedisTemplate<String, String> redisTemplate) {
        
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.masterPlaylistExpiration = masterPlaylistExpiration;  // 600000ms = 10 minutes
        this.segmentExpiration = segmentExpiration;  // 300000ms = 5 minutes
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * Generates a JWT token for master playlist access.
     *
     * @param userId the authenticated user identifier
     * @param videoId the video identifier
     * @return signed JWT token valid for 10 minutes
     */
    public String generateMasterPlaylistToken(String userId, String videoId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + masterPlaylistExpiration);
        
        return Jwts.builder()
            .setSubject(userId)  // The user watching
            .claim("videoId", videoId)  // The video being watched
            .claim("type", "master")  // Token type
            .setIssuedAt(now)
            .setExpiration(expiry)
            .signWith(secretKey, SignatureAlgorithm.HS256)
            .compact();
    }
    
    /**
     * Generates a JWT token for individual video segment access.
     * <p>
     * Token is bound to a specific segment file to prevent reuse across different segments.
     *
     * @param userId the authenticated user identifier
     * @param videoId the video identifier
     * @param segmentFile the specific segment filename
     * @return signed JWT token valid for 5 minutes
     */
    public String generateSegmentToken(String userId, String videoId, String segmentFile) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + segmentExpiration);
        
        return Jwts.builder()
            .setSubject(userId)
            .claim("videoId", videoId)
            .claim("segmentFile", segmentFile)  // Specific segment this token is valid for
            .claim("type", "segment")
            .setIssuedAt(now)
            .setExpiration(expiry)
            .signWith(secretKey, SignatureAlgorithm.HS256)
            .compact();
    }
    
    /**
     * Verifies and parses a JWT token.
     * <p>
     * Validation includes:
     * <ul>
     *   <li>Blacklist verification against Redis cache</li>
     *   <li>Cryptographic signature validation</li>
     *   <li>Expiration check</li>
     * </ul>
     *
     * @param token the JWT token to verify
     * @return TokenClaims if valid, null otherwise
     */
    public TokenClaims verifyToken(String token) {
        try {
            String blacklistKey = "token:blacklist:" + token;
            Boolean isBlacklisted = redisTemplate.hasKey(blacklistKey);
            
            if (Boolean.TRUE.equals(isBlacklisted)) {
                return null;
            }
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            
            return new TokenClaims(
                claims.getSubject(),  // userId
                claims.get("videoId", String.class),
                claims.get("segmentFile", String.class),
                claims.get("type", String.class),
                claims.getExpiration()
            );
            
        } catch (ExpiredJwtException e) {
            return null;  // Token expired
        } catch (JwtException e) {
            return null;  // Invalid signature or malformed token
        }
    }
    
    /**
     * Revokes a token by adding it to the Redis blacklist.
     * <p>
     * Token remains blacklisted until its original expiration time.
     *
     * @param token the token to revoke
     * @param expirationMs time until token naturally expires (milliseconds)
     */
    public void revokeToken(String token, long expirationMs) {
        String blacklistKey = "token:blacklist:" + token;
        redisTemplate.opsForValue().set(
            blacklistKey, 
            "revoked", 
            expirationMs, 
            TimeUnit.MILLISECONDS
        );
    }
    
    /**
     * Data transfer object for JWT token claims.
     */
    @Getter
    public static class TokenClaims {
        private final String userId;
        private final String videoId;
        private final String segmentFile;
        private final String type;
        private final Date expiresAt;
        
        public TokenClaims(String userId, String videoId, String segmentFile, 
                          String type, Date expiresAt) {
            this.userId = userId;
            this.videoId = videoId;
            this.segmentFile = segmentFile;
            this.type = type;
            this.expiresAt = expiresAt;
        }
        
        public boolean isExpired() {
            return expiresAt.before(new Date());
        }
    }
}
