# Docker Setup Guide

This guide explains how to run the Movie Streaming Platform using Docker.

## Prerequisites

- Docker Desktop installed (includes Docker Compose)
- At least 4GB of RAM available for Docker
- Ports 8080, 5000, 27017, 6379 available

## Quick Start

### 1. Environment Setup

Copy the environment template and configure it:

```bash
# Copy the template
cp .env.docker .env

# Edit .env and add your Firebase credentials
# You can find these in Firebase Console > Project Settings > Service Accounts
```

**Important**: Update these values in `.env`:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Your Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Your Firebase service account email
- All other Firebase fields from your service-account.json

### 2. Build and Start Services

```bash
# Build all images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### 3. Verify Services

Check if all services are healthy:

```bash
docker-compose ps
```

All services should show "healthy" status.

### 4. Access the Application

- **Backend API**: http://localhost:8080
- **ML Service**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6379

### 5. Test the Setup

```bash
# Test backend health
curl http://localhost:8080/actuator/health

# Test ML service health
curl http://localhost:5000/health

# Test MongoDB connection
docker exec -it movie-platform-mongodb mongosh --eval "db.adminCommand('ping')"

# Test Redis connection
docker exec -it movie-platform-redis redis-cli ping
```

## Development Mode

For development with hot reload:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This includes:
- Source code mounted as volumes (changes reflect immediately)
- Mongo Express UI at http://localhost:8081 (admin/admin)
- Debug logging enabled

## Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-service

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands in Containers

```bash
# Access backend container shell
docker exec -it movie-platform-backend bash

# Access ML service container shell
docker exec -it movie-platform-ml-service bash

# Check FFmpeg in backend
docker exec movie-platform-backend ffmpeg -version

# Check Python packages in ML service
docker exec movie-platform-ml-service pip list
```

### Rebuild Services

```bash
# Rebuild specific service
docker-compose build backend

# Rebuild without cache
docker-compose build --no-cache backend

# Rebuild and restart
docker-compose up -d --build backend
```

## Data Persistence

Data is stored in Docker named volumes:

- `mongo-data`: MongoDB database
- `redis-data`: Redis cache
- `video-uploads`: Raw uploaded videos
- `video-processed`: HLS segments and thumbnails
- `ml-models`: Trained ML models

### Backup Volumes

```bash
# Backup MongoDB
docker exec movie-platform-mongodb mongodump --out /data/backup
docker cp movie-platform-mongodb:/data/backup ./mongodb-backup

# Backup videos
docker run --rm -v movie-streaming-platform_video-processed:/data -v $(pwd):/backup \
  alpine tar czf /backup/videos-backup.tar.gz /data
```

### Restore Volumes

```bash
# Restore MongoDB
docker cp ./mongodb-backup movie-platform-mongodb:/data/backup
docker exec movie-platform-mongodb mongorestore /data/backup
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
netstat -ano | findstr :8080

# Remove and recreate container
docker-compose rm -f backend
docker-compose up -d backend
```

### FFmpeg Not Found

```bash
# Verify FFmpeg installation
docker exec movie-platform-backend ffmpeg -version

# If missing, rebuild image
docker-compose build --no-cache backend
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is healthy
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker exec -it movie-platform-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Redis Connection Failed

```bash
# Check Redis health
docker exec movie-platform-redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Out of Disk Space

```bash
# Clean up unused images and containers
docker system prune -a

# Remove all stopped containers
docker container prune -f

# Remove unused volumes (WARNING: deletes data)
docker volume prune -f
```

### ML Service Can't Train Models

```bash
# Check if MongoDB has data
docker exec -it movie-platform-mongodb mongosh moviestreamingdb --eval "db.movies.count()"

# Check ML service logs
docker-compose logs ml-service

# Manually trigger training
curl -X POST http://localhost:5000/train
```

## Production Deployment

### Security Checklist

- [ ] Generate strong JWT_SECRET
- [ ] Use secrets management (Docker Swarm secrets or Kubernetes secrets)
- [ ] Don't commit `.env` to Git
- [ ] Use reverse proxy (Nginx) for HTTPS
- [ ] Set up firewall rules
- [ ] Enable authentication on MongoDB and Redis
- [ ] Use Docker secrets instead of environment variables

### Production docker-compose.yml

Create `docker-compose.prod.yml`:

```yaml
services:
  backend:
    restart: always
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

Run with:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Networking

All services communicate via the `movie-platform-network` bridge network:

- Backend connects to `mongodb:27017` (not `localhost:27017`)
- Backend connects to `redis:6379` (not `localhost:6379`)
- Backend connects to `ml-service:5000` (not `localhost:5000`)

## Resource Limits

Default resource allocation:

- MongoDB: No limits (uses what it needs)
- Redis: Minimal (~50MB)
- Backend: ~1-2GB RAM
- ML Service: ~500MB-1GB RAM

Adjust in docker-compose.yml if needed:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Health Checks

All services have health checks:

- MongoDB: `mongosh ping` every 10s
- Redis: `redis-cli ping` every 10s
- Backend: `curl /actuator/health` every 30s
- ML Service: `curl /health` every 30s

## Environment Variables Reference

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/moviestreamingdb` |
| `SPRING_DATA_REDIS_HOST` | Redis host | `redis` |
| `SPRING_DATA_REDIS_PORT` | Redis port | `6379` |
| `ML_SERVICE_URL` | ML service URL | `http://ml-service:5000` |
| `VIDEO_UPLOAD_DIR` | Upload directory | `/app/videos` |
| `VIDEO_PROCESSED_DIR` | Processed videos directory | `/app/videos_processed` |
| `JWT_SECRET` | JWT signing key | **REQUIRED** |
| `FIREBASE_*` | Firebase credentials | **REQUIRED** |

### ML Service

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongodb:27017` |
| `MONGO_DB_NAME` | Database name | `moviestreamingdb` |
| `PORT` | Service port | `5000` |
| `N_COMPONENTS` | SVD components | `15` |
| `MODEL_PATH` | Model save path | `saved_models/recommender.pkl` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all ports are available
4. Check Docker Desktop has enough resources
