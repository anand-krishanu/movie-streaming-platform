# Backend Architecture

## Overview
Spring Boot 3.5.7 application with layered architecture. Provides RESTful APIs for video streaming, user management, and ML recommendations.

**Core Features**: HLS video streaming, Firebase authentication, Redis caching, WebSocket watch parties, ML integration

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Spring Boot 3.5.7, Java 21 | Application runtime |
| **Database** | MongoDB | Primary data store |
| **Cache** | Redis | Performance optimization |
| **Authentication** | Firebase Admin SDK 9.7.0 | User authentication |
| **Tokens** | JWT (jjwt 0.11.5) | Video segment authorization |
| **Video** | FFmpeg | HLS transcoding |
| **Real-time** | Spring WebSocket | Watch parties |

---

## Architecture

### Layered Structure
```
Controller → Service → Repository → MongoDB
    ↓
Security Filters (CORS, Firebase JWT)
    ↓
Redis Cache (userAccess, videoMetadata, tokenBlacklist)
```

### Request Flow
```
Request → CORS → Firebase Token Filter → Controller → Service
                        ↓                                 ↓
                  Validate JWT                     Check Redis Cache
                        ↓                                 ↓
                  Security Context                MongoDB (if cache miss)
```

---

## System Components

### Controllers
| Controller | Path | Responsibility |
|------------|------|----------------|
| **AuthController** | `/api/auth` | Register, login, profile |
| **MovieController** | `/api/movies` | CRUD, search, filter, legacy streaming |
| **VideoStreamController** | `/api/videos` | Secure tokenized streaming |
| **UserController** | `/api/users` | Watchlist, favorites, history |
| **WatchPartyController** | `/api/watch-parties` | Group viewing sessions |
| **WatchPartyWebSocketController** | `/ws/watch-party` | Real-time sync |

### Services (Key)
- **MovieService**: Upload, metadata, FFmpeg processing
- **VideoTokenService**: JWT generation (master 10min, segment 5min)
- **VideoAccessService**: Cached permission checks (5min TTL)
- **PlaylistService**: M3U8 URL tokenization
- **VideoProcessingService**: FFmpeg HLS conversion
- **MLRecommendationService**: ML API integration

### Security
- **FirebaseTokenFilter**: Validates Firebase JWT, sets SecurityContext
- **SecurityConfiguration**: CORS, endpoint rules, WebSocket security

### Configuration
- **CacheConfig**: Redis caches (userAccess 5min, videoMetadata 15min, tokenBlacklist 1hr)
- **RedisConfig**: RedisTemplate for token blacklist
- **WebSocketConfig**: `/ws` endpoint, message broker

---

## Database Schema (MongoDB)

**users**: `{ firebaseUid, email, displayName, role, watchlist[], favorites[], watchHistory[] }`

**movies**: `{ title, description, genres[], releaseYear, imdbRating, poster, videoUrl, uploadedBy, views, likes[], duration, status }`

**watchProgress**: `{ userId, movieId, timestampSeconds, durationSeconds, completed }`

**watchParties**: `{ movieId, hostId, participants[], currentTimestamp, isPlaying }`

---

## API Endpoints

### Core Endpoints
```
# Auth & Users
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/{id}/watchlist
POST   /api/users/{id}/progress

# Movies
GET    /api/movies              # List (paginated)
GET    /api/movies/{id}         # Details
GET    /api/movies/search?title=...
POST   /api/movies/upload       # Admin only
POST   /api/movies/{id}/like

# Streaming
GET    /api/movies/stream/{id}/master.m3u8          # Legacy (unsecured)
GET    /api/videos/{id}/player                       # Secure (tokenized)
GET    /api/videos/{id}/master.m3u8?token=xyz        # Tokenized playlist
GET    /api/videos/{id}/segments/file.ts?token=abc   # Tokenized segment

# ML & Watch Parties
GET    /api/movies/recommendations
POST   /api/watch-parties/create
CONNECT /ws
```

---

## Security Architecture

### Dual Authentication
1. **Firebase JWT**: User authentication (all API requests)
2. **Video Tokens**: Segment authorization (HLS streaming)

### Secure Streaming Flow
```
Step 1: Player Init
  GET /api/videos/{id}/player (Firebase auth required)
  → Check access (Redis cached)
  → Return master playlist URL + token (10min TTL)

Step 2: Playlist
  GET /master.m3u8?token=xyz
  → Validate token
  → Tokenize segment URLs (5min each)
  → Return modified playlist

Step 3: Segments (×200)
  GET /segments/file.ts?token=abc
  → Validate segment token
  → Check access (Redis ~2ms)
  → Serve file
```

### Token Structure
**Firebase JWT**: Standard OAuth2 with `user_id`, `email`, `exp`  
**Video Token**: `{ userId, videoId, segmentFile, type, exp }`

---

## Video Streaming

### Processing Pipeline
```
Upload (2GB max) → Validate (format) → FFmpeg → HLS (.m3u8 + .ts segments) → Ready
```

### HLS Structure
```
videos_processed/{movie-id}/
├── master.m3u8
├── segment_0_000.ts
├── segment_0_001.ts
└── ... (~200 segments)
```

### Tokenization
Original: `segment_0_000.ts`  
Tokenized: `/api/videos/{id}/segments/segment_0_000.ts?token=eyJhbG...`

---

## Redis Caching Strategy

| Cache | TTL | Key Format | Purpose |
|-------|-----|------------|---------|
| **userAccess** | 5 min | `userId:videoId` | Permission checks (200× per video) |
| **videoMetadata** | 15 min | `videoId` | Movie details |
| **tokenBlacklist** | 1 hour | `token:blacklist:jwt` | Revoked tokens |

**Performance**: 
- Without cache: 200 segments × 50ms = 10s
- With cache: 1 × 50ms + 199 × 2ms = 448ms (22× faster)

---

## Configuration

**application.properties**:
```properties
server.port=8080
spring.data.mongodb.uri=${MONGODB_URI}
spring.redis.host=localhost
spring.redis.port=6379
jwt.secret=${JWT_SECRET}
jwt.master-playlist.expiration=600000  # 10min
jwt.segment.expiration=300000          # 5min
video.upload.dir=${VIDEO_UPLOAD_DIR}
video.processed.dir=${VIDEO_PROCESSED_DIR}
spring.servlet.multipart.max-file-size=2GB
```

**.env**:
```env
MONGODB_URI=mongodb://localhost:27017/moviestreamingdb
JWT_SECRET=your-256-bit-secret-key
VIDEO_UPLOAD_DIR=/path/to/videos
VIDEO_PROCESSED_DIR=/path/to/videos_processed
```

---

## Deployment

**Development**: Single machine (Spring Boot:8080, MongoDB:27017, Redis:6379, ML:5000)

**Production**: Load balancer → Multiple Spring Boot pods → MongoDB replica set + Redis cluster + Firebase + ML service

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Redis connection failed | Start Redis: `redis-cli ping` should return PONG |
| Token validation failed | Check JWT_SECRET in .env, verify token not expired |
| Video upload failed | Increase `max-file-size` in properties |
| FFmpeg not found | Install FFmpeg, add to PATH: `ffmpeg -version` |

---

**Version**: 1.0  
**Last Updated**: December 29, 2025
