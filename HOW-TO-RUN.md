# How to Run - Movie Streaming Platform

Quick guide to run this application using Docker Compose or Kubernetes.

---

## Prerequisites

**Required:**
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **MongoDB** (local) - [Download](https://www.mongodb.com/try/download/community)
- **Firebase Account** - [Get Started](https://console.firebase.google.com/)

**For Kubernetes:**
- **Minikube** - [Download](https://minikube.sigs.k8s.io/docs/start/)
- **kubectl** - [Download](https://kubernetes.io/docs/tasks/tools/)

**System:** 4 CPU cores, 8GB RAM, 10GB free space

---

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/anand-krishanu/movie-streaming-platform.git
cd movie-streaming-platform
```

### 2. Firebase Configuration

**Backend (Service Account):**
1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. Generate New Private Key → Download JSON
3. Rename to `service-account.json` and place in: `BACKEND/src/main/resources/`

**Frontend & Environment:**
1. In Firebase Console → Project Settings → General → Your apps → Web
2. Register app and copy config
3. Create `.env` file in **project root**:

```env
# Backend Firebase (from service-account.json)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# Frontend Firebase (from web app config)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# MongoDB (use host.docker.internal for Docker on Windows/Mac)
MONGODB_URI=mongodb://host.docker.internal:27017/moviestreamingdb
MONGO_URI=mongodb://host.docker.internal:27017
MONGO_DB_NAME=moviestreamingdb

# API URLs
VITE_API_URL=http://localhost:8080
VITE_ML_API_URL=http://localhost:5000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

4. Enable Google Sign-In: Firebase Console → Authentication → Sign-in method → Google → Enable

### 3. Start MongoDB

**Windows:**
```powershell
choco install mongodb
net start MongoDB
```

**Linux:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

---

## Running with Docker Compose

### Quick Start

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Verify all services are healthy
docker-compose ps
```

All services should show **"Up (healthy)"** status.

### Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **ML Service**: http://localhost:5000/docs

### Manage Services

```bash
# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down
```

---

## Running with Kubernetes

### 1. Install Tools

**Minikube:**
```bash
# Windows
choco install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# macOS
brew install minikube
```

**kubectl:**
```bash
# Windows
choco install kubernetes-cli

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl

# macOS
brew install kubectl
```

### 2. Start Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=4096
kubectl cluster-info
```

### 3. Deploy Application

**Option A: Automated (Recommended)**
```bash
.\kubernetes\deploy.ps1    # Windows
bash kubernetes/deploy.sh  # Linux/Mac
```

**Option B: Manual**
```bash
# Build and load images
docker-compose build
minikube image load movie-streaming-platform-backend:latest
minikube image load movie-streaming-platform-frontend:latest
minikube image load movie-streaming-platform-ml-service:latest

# Deploy
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/ml-service-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml

# Create secrets (load .env first)
kubectl create secret generic firebase-secrets -n movie-platform \
  --from-literal=FIREBASE_TYPE="$FIREBASE_TYPE" \
  --from-literal=FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
  --from-literal=FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  --from-literal=FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL"
  # ... add other Firebase env vars
```

### 4. Verify Deployment

```bash
kubectl get pods -n movie-platform
kubectl get svc -n movie-platform
```

All pods should show **Running** status.

### 5. Access Application

Use port-forwarding (keep terminals open):

**Terminal 1:**
```bash
kubectl port-forward -n movie-platform service/frontend-service 3000:3000
```

**Terminal 2:**
```bash
kubectl port-forward -n movie-platform service/backend-service 8080:8080
```

Access: http://localhost:3000

### 6. Manage Kubernetes

```bash
# View logs
kubectl logs -n movie-platform <pod-name>

# Scale deployment
kubectl scale deployment backend -n movie-platform --replicas=3

# Stop and cleanup
kubectl delete namespace movie-platform
minikube stop
```

---

## Using the Application

### User Features

1. **Sign In**: Go to http://localhost:3000 → Sign in with Google
2. **Browse Movies**: Search, filter by genre, paginate
3. **Watch Movies**: Click movie → Play → Adaptive quality (360p-1080p)
4. **Collections**: Add to Favorites, Watch Later
5. **Recommendations**: Check "For You" section (AI-powered)
6. **Watch Party**: Click "Watch Together" → Share link → Synced viewing

### Admin Features

**Make yourself admin:**
```bash
mongosh
use moviestreamingdb
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "admin" } }
)
```

**Then:**
- Go to http://localhost:3000/admin
- Upload movies (MP4/MKV/AVI, max 2GB)
- System auto-processes to HLS format (360p/480p/720p/1080p)
- Train ML model to update recommendations

---

## Troubleshooting

### Docker Issues

**Services not starting:**
```bash
docker-compose logs backend  # Check error logs
docker-compose restart backend
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <process-id> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**MongoDB connection failed:**
- Verify MongoDB is running: `mongosh`
- Check `.env` has correct `MONGODB_URI`
- Use `host.docker.internal` instead of `localhost` in Docker

### Kubernetes Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n movie-platform
kubectl logs <pod-name> -n movie-platform
```

**Images not found:**
```bash
docker-compose build
minikube image load movie-streaming-platform-backend:latest
minikube image load movie-streaming-platform-frontend:latest
minikube image load movie-streaming-platform-ml-service:latest
```

**Minikube not starting:**
```bash
minikube delete
minikube start --driver=docker --cpus=4 --memory=4096
```

### Application Issues

**Google Sign-In fails:**
- Check Firebase `.env` configuration
- Verify Firebase Authentication is enabled
- Clear browser cache

**Videos not playing:**
- Check `BACKEND/videos/` and `BACKEND/videos_processed/` exist
- Verify volume mounts in `docker-compose.yml`:
  ```yaml
  volumes:
    - ./BACKEND/videos:/app/videos
    - ./BACKEND/videos_processed:/app/videos_processed
  ```

**Recommendations not loading:**
- Train ML model first (Admin Dashboard → Train Model)
- Check ML service: `curl http://localhost:5000/health`

---

## Quick Reference

### Docker Commands

```bash
docker-compose build              # Build images
docker-compose up -d              # Start services
docker-compose ps                 # Check status
docker-compose logs -f            # View logs
docker-compose restart backend    # Restart service
docker-compose down               # Stop all
```

### Kubernetes Commands

```bash
.\kubernetes\deploy.ps1                           # Deploy all
kubectl get pods -n movie-platform                # Check pods
kubectl get svc -n movie-platform                 # Check services
kubectl logs <pod-name> -n movie-platform         # View logs
kubectl scale deployment backend --replicas=3     # Scale
kubectl delete namespace movie-platform           # Cleanup
```

### MongoDB Commands

```bash
mongosh                                   # Connect
use moviestreamingdb                      # Switch DB
db.movies.find().pretty()                 # View movies
db.users.updateOne(                       # Make admin
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## Additional Info

**Video Storage:**
- Raw videos: `BACKEND/videos/`
- Processed (HLS): `BACKEND/videos_processed/<movieId>/`
- Docker uses bind mounts to access host files

**Service Ports:**
- Frontend: 3000
- Backend: 8080
- ML Service: 5000
- Redis: 6379

**Architecture Docs:**
- [Frontend](FRONTEND_ARCHITECTURE.md) - React components, routing
- [Backend](BACKEND_ARCHITECTURE.md) - Spring Boot APIs, security
- [ML Service](ML_ARCHITECTURE.md) - Recommendation algorithms

---

**Questions?** Check logs first: `docker-compose logs` or `kubectl logs`
