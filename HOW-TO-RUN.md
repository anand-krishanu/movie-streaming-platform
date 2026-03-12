# How to Run - Movie Streaming Platform

Everything runs inside Docker. **No MongoDB, Redis, Java, or Python required on the host machine.**

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Docker Desktop** | [Download](https://www.docker.com/products/docker-desktop/) — includes Docker Compose |
| **Git** | To clone the repository |
| **Firebase project** | Free tier is sufficient — [console.firebase.google.com](https://console.firebase.google.com/) |

**Minimum system specs:** 4 CPU cores, 8 GB RAM, 10 GB free disk space

---

## Service Ports

| Service | URL |
|---|---|
| Frontend | http://localhost:7380 |
| Backend API | http://localhost:9870/api |
| ML Service | http://localhost:8743/docs |
| MongoDB | localhost:37017 (internal — no client needed) |
| Redis | localhost:7379 (internal) |

---

## Step-by-Step Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/anand-krishanu/movie-streaming-platform.git
cd movie-streaming-platform
```

---

### Step 2 — Create your Firebase project

> Skip if you already have one.

1. Go to [console.firebase.google.com](https://console.firebase.google.com/) → **Add project**
2. **Enable Google Sign-In:**  
   Authentication → Sign-in method → Google → Enable
3. **Get backend credentials (Service Account):**  
   Project Settings → Service Accounts → **Generate new private key** → download the JSON file
4. **Get frontend credentials:**  
   Project Settings → General → Your apps → **Add web app** → copy the config object

---

### Step 3 — Create the `.env` file

Create a file named `.env` in the **project root** (same folder as `docker-compose.yml`).  
Copy the template below and fill in your values:

```env
# ── Backend Firebase (from the downloaded service-account JSON) ──────────────
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# ── Frontend Firebase (from the web app config object) ───────────────────────
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id

# ── Database (do NOT change — these are container-internal addresses) ─────────
MONGODB_URI=mongodb://mongodb:27017/moviestreamingdb
MONGO_URI=mongodb://mongodb:27017
MONGO_DB_NAME=moviestreamingdb

# ── API URLs (must match the host ports below) ────────────────────────────────
VITE_API_URL=http://localhost:9870/api
VITE_ML_API_URL=http://localhost:8743

# ── Redis (do NOT change) ─────────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379

# ── Security ──────────────────────────────────────────────────────────────────
JWT_SECRET=change-this-to-a-random-256-bit-string

# ── ML Service ────────────────────────────────────────────────────────────────
N_COMPONENTS=15
MODEL_PATH=saved_models/recommender.pkl
LOG_LEVEL=INFO
```

> **FIREBASE_PRIVATE_KEY tip:** The value must have literal `\n` characters (backslash-n), **not** actual newlines. Copy it exactly as it appears in the downloaded JSON file — it already has the right format.

---

### Step 4 — Build and start all containers

```bash
docker-compose up -d --build
```

This builds and starts 5 containers: `mongodb`, `redis`, `backend`, `ml-service`, `frontend`.  
First run takes ~5 minutes (downloading base images + building).

**Check everything is healthy:**

```bash
docker-compose ps
```

All 5 services should show **`(healthy)`** or **`Up`** status.

---

### Step 5 — Open the app

- **App:** http://localhost:7380
- **Backend API:** http://localhost:9870/api
- **ML Service docs:** http://localhost:8743/docs

Sign in with Google → you're in.

---

## Becoming an Admin

Admin access lets you upload movies and train the recommendation model.

Connect to MongoDB inside Docker and promote your account:

```bash
docker exec -it movie-platform-mongodb mongosh
```

Then in the Mongo shell:

```js
use moviestreamingdb
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "ADMIN" } }
)
exit
```

Refresh the app → navigate to http://localhost:7380/admin

---

## Common Commands

```bash
# View real-time logs for all services
docker-compose logs -f

# View logs for one service (backend / frontend / ml-service / mongodb / redis)
docker-compose logs -f backend

# Restart a single service
docker-compose restart backend

# Stop everything (keeps data volumes)
docker-compose down

# Stop and wipe all data (fresh start)
docker-compose down -v

# Rebuild a single service after code changes
docker-compose up -d --build backend
```

---

## Troubleshooting

### 403 errors on login

The frontend bundle bakes in the API URL at build time via Vite.  
If you change `VITE_API_URL` in `.env`, you must **rebuild** the frontend:

```bash
docker-compose up -d --build frontend
```

### Google Sign-In popup blocked / COOP error

This is handled by the nginx config — make sure the frontend container was rebuilt after any `nginx.conf` changes.

### Backend can't connect to Firebase

- Verify `FIREBASE_PRIVATE_KEY` has literal `\n` sequences (not real newlines).
- Verify `FIREBASE_CLIENT_EMAIL` matches the service account JSON.

```bash
docker-compose logs backend | grep -i firebase
```

### MongoDB connection refused

```bash
docker-compose logs mongodb
docker-compose restart mongodb
```

Wait ~15 seconds for MongoDB to become healthy, then restart the backend:

```bash
docker-compose restart backend
```

### Port already in use

```bash
# Windows — find what's using port 9870
netstat -ano | findstr :9870

# Linux / macOS
lsof -ti:9870 | xargs kill -9
```

Or change the host-side port in `docker-compose.yml` (e.g. `"9871:8080"`) and update `VITE_API_URL` in `.env` accordingly, then rebuild.

### Recommendations not loading

The ML model must be trained at least once.  
Log in as admin → Admin Dashboard → **Train Model**.

---

## Kubernetes (Optional)

See [`kubernetes/`](kubernetes/) for manifests and deployment scripts.  
Requires **Minikube** + **kubectl** installed.

---

## Architecture Docs

- [Frontend architecture](FRONTEND_ARCHITECTURE.md)
- [Backend architecture](BACKEND_ARCHITECTURE.md)
- [ML Service architecture](ML_ARCHITECTURE.md)




---

**Questions?** Check logs first: `docker-compose logs` or `kubectl logs`
