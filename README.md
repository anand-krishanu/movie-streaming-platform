# 🎬 Movie Streaming Platform

A full-stack Netflix-style movie streaming platform with AI-powered recommendations and real-time watch parties.

---

## 📚 Documentation

| Component | Description | Link |
|-----------|-------------|------|
| 🎨 **Frontend** | React architecture, components, routing, state management | [View Frontend Architecture](FRONTEND_ARCHITECTURE.md) |
| ⚙️ **Backend** | Spring Boot layers, security, APIs, caching, WebSocket | [View Backend Architecture](BACKEND_ARCHITECTURE.md) |
| 🤖 **ML Service** | Recommendation algorithms, training pipeline, data scoring | [View ML Architecture](ML_ARCHITECTURE.md) |

---

## ✨ Features

- **Adaptive Video Streaming**: HLS (HTTP Live Streaming) with multiple quality levels (360p-1080p)
- **Custom Video Player**: Sleek custom UI with volume/playback controls and keyboard shortcuts
- **Smart Timeline**: Netflix-style thumbnail previews when hovering over the progress bar
- **AI Recommendations**: Hybrid ML model using Collaborative Filtering, Content-Based, and Popularity algorithms
- **Watch Parties**: Real-time synchronized viewing with WebSocket technology
- **Secure Authentication**: Firebase Google OAuth integration
- **Admin Dashboard**: Upload movies, manage content, train ML models
- **Progress Tracking**: Resume watching from where you left off
- **User Collections**: Favorites, Watch Later, and Watch History
- **Search & Discovery**: Genre filtering, search, and pagination
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────┐
│     React       │ ───► │  Spring Boot    │ ───► │  MongoDB    │
│   (Frontend)    │      │   (Backend)     │      │ (Database)  │
│    Port 5173    │ ◄─── │   Port 8080     │ ◄─── │             │
└─────────────────┘      └─────────────────┘      └─────────────┘
                                │                          ▲
                                │                          │
                                ▼                          │
                         ┌─────────────────┐              │
                         │  Python FastAPI │              │
                         │   (ML Service)  │──────────────┘
                         │   Port 5000     │
                         └─────────────────┘
                                ▲
                                │
                         ┌─────────────────┐
                         │     Redis       │
                         │  (Cache Layer)  │
                         └─────────────────┘
```

### 🔗 Architecture Details

For detailed architecture documentation, see:
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Component hierarchy, routing, state management, video player
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - Layered architecture, security, Redis caching, WebSocket
- **[ML Architecture](ML_ARCHITECTURE.md)** - Hybrid recommendation system, NMF, content-based filtering

## 🛠️ Tech Stack

### Frontend ([Detailed Docs](FRONTEND_ARCHITECTURE.md))
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS
- **State Management**: Context API
- **Routing**: React Router DOM
- **Video Player**: Custom HLS Player (HLS.js) with Thumbnail Previews
- **Real-time**: Socket.IO Client (WebSocket)
- **HTTP Client**: Axios
- **Authentication**: Firebase
- **UI Components**: React Icons, Lucide React, React Hot Toast

### Backend ([Detailed Docs](BACKEND_ARCHITECTURE.md))
- **Framework**: Spring Boot 3.5.7 (Java 21)
- **Security**: Spring Security + Firebase Admin SDK + JWT Tokens
- **Database**: MongoDB (Spring Data MongoDB)
- **Cache**: Redis (for video access, metadata, token blacklist)
- **WebSocket**: Spring WebSocket (STOMP protocol)
- **Video Processing**: FFmpeg (HLS segmentation + Thumbnail generation)
- **Build Tool**: Maven

### ML Service ([Detailed Docs](ML_ARCHITECTURE.md))
- **Framework**: FastAPI (Python 3.10+)
- **ML Libraries**: scikit-learn, Pandas, NumPy
- **Algorithms**: 
  - Non-negative Matrix Factorization (NMF) for Collaborative Filtering
  - Cosine Similarity for Content-Based Filtering
  - Popularity-Based for Cold Start
- **Database**: PyMongo
- **Server**: Uvicorn

### Database
- **Type**: MongoDB (NoSQL)
- **Collections**: users, movies, watchProgress, watch_parties

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js**: v18+ and npm
- **Java**: JDK 21 (required for Spring Boot 3.5.7)
- **Maven**: 3.8+
- **Python**: 3.10+
- **MongoDB**: 5.0+ (running locally or remote)
- **Redis**: Latest version (for caching)
- **FFmpeg**: Latest version (for video processing)
- **Firebase Account**: For authentication setup

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/anand-krishanu/movie-streaming-platform.git
cd movie-streaming-platform
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → **Google Sign-In**
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key** → Save as `serviceAccountKey.json`
6. Place `serviceAccountKey.json` in `BACKEND/src/main/resources/`

### 3. Backend Setup (Spring Boot)

#### Install Redis

Redis is required for caching video access permissions, metadata, and token blacklist.

**Windows** (PowerShell):
```powershell
# Use the provided script
.\BACKEND\install-redis.ps1

# Or manually with Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**Linux/Mac**:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

#### Set Environment Variables

Create a `.env` file or set these environment variables:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/moviestreamingnosql

# Firebase (optional, if not using serviceAccountKey.json)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Video Storage Paths
VIDEO_UPLOAD_DIR=./videos
VIDEO_PROCESSED_DIR=./videos_processed
```

#### Run Backend

```bash
cd BACKEND
mvn clean install
mvn spring-boot:run
```

Backend will start on **http://localhost:8080**

### 4. Frontend Setup (React)

#### Install Dependencies

```bash
cd FRONTEND
npm install
```

#### Configure Firebase

1. Go to Firebase Console → **Project Settings** → **Web App**
2. Copy your Firebase config
3. Update `FRONTEND/src/firebase.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

#### Run Frontend

```bash
npm run dev
```

Frontend will start on **http://localhost:5173**

### 5. ML Service Setup (Python)

#### Install Python Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

#### Configure Environment

Create a `.env` file in `ml-service/`:

```bash
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=moviestreamingnosql
PORT=5000
```

#### Run ML Service

```bash
python app.py
```

ML Service will start on **http://localhost:5000**

### 6. MongoDB Setup

#### Option 1: Local MongoDB

```bash
# Install MongoDB and start the service
mongod --dbpath /path/to/your/data
```

#### Option 2: MongoDB Atlas (Cloud)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in environment variables

## Project Structure

```
movie-streaming-platform/
├── BACKEND/                    # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/anand/backend/
│   │       ├── config/         # Security, WebSocket config
│   │       ├── controller/     # REST & WebSocket controllers
│   │       ├── entity/         # MongoDB models
│   │       ├── repository/     # Data access layer
│   │       └── service/        # Business logic
│   └── src/main/resources/
│       └── application.properties
├── FRONTEND/                   # React Frontend
│   ├── src/
│   │   ├── api/               # API client (Axios)
│   │   ├── components/        # Reusable components
│   │   ├── context/           # Zustand stores
│   │   ├── pages/             # Page components
│   │   ├── routes/            # Routing config
│   │   └── utils/             # Helper functions
│   └── package.json
├── ml-service/                # Python ML Service
│   ├── data/                  # Data loading utilities
│   ├── models/                # ML algorithms
│   ├── saved_models/          # Trained model storage
│   ├── app.py                 # FastAPI server
│   └── requirements.txt
└── README.md
```

## 🚀 Usage Guide

### For Users

1. **Login**: Click "Sign in with Google"
2. **Browse Movies**: Explore by genre, search, or use filters
3. **Watch Movies**: Click any movie to start streaming
   - **Legacy Player**: Standard HLS streaming
   - **Secure Player**: Tokenized segment access (recommended)
4. **Add to Favorites**: Click the heart icon
5. **Save for Later**: Add to "Watch Later" list
6. **Track Progress**: Resume watching from where you left off
7. **Get Recommendations**: Check "For You" section for personalized picks
8. **Watch Together**: Click "Watch Together" to create a room and share the link with friends
   - Real-time synchronized playback
   - See who's watching with you
   - Synced play/pause/seek controls

### For Admins

1. **Login as Admin**: Use an admin account
2. **Upload Movie**:
   - Go to Admin Dashboard
   - Fill in movie details (title, description, genres, release year, IMDb rating)
   - Upload video file (MP4, MKV, AVI - max 2GB)
   - System auto-processes video to HLS format with multiple quality levels
   - Automatically generates thumbnail previews
3. **Train ML Model**: Click "Train Model" to update recommendations with latest user data
4. **View Statistics**: Check user engagement metrics and popular content
5. **Manage Content**: Delete or update existing movies

## ⚙️ Configuration

### Backend Configuration (`application.properties`)

```properties
server.port=8080
spring.data.mongodb.uri=${MONGODB_URI}
video.upload.dir=${VIDEO_UPLOAD_DIR}
video.processed.dir=${VIDEO_PROCESSED_DIR}
ml.service.url=http://localhost:5000
spring.servlet.multipart.max-file-size=2GB
spring.servlet.multipart.max-request-size=2GB

# Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379

# JWT Token Configuration
jwt.secret=${JWT_SECRET:your-secret-key-min-32-chars}
jwt.master-expiration=600000      # 10 minutes
jwt.segment-expiration=300000     # 5 minutes
```

### Frontend Configuration

- **API Base URL**: Set in `FRONTEND/src/api/*.js` (default: `http://localhost:8080/api`)
- **WebSocket URL**: Set in `FRONTEND/src/utils/websocket.js` (default: `http://localhost:8080/ws`)
- **Firebase Config**: Set in `FRONTEND/src/firebase.js`

### ML Service Configuration

- **MongoDB URI**: Set in `.env` or environment variables
- **Port**: Default 5000, configurable via `PORT` environment variable
- **Model Path**: `ml-service/saved_models/` for persisted models

## 🤖 ML Model Details

> **For complete ML architecture, see [ML_ARCHITECTURE.md](ML_ARCHITECTURE.md)**

### Algorithm: Hybrid Recommendation System

1. **Collaborative Filtering** (Matrix Factorization - NMF)
   - Finds patterns in user viewing behavior
   - Discovers 15 latent factors (user preferences)
   - "Users like you also enjoyed..."

2. **Content-Based Filtering** (Cosine Similarity)
   - Analyzes genre combinations
   - Finds similar movies by content
   - "Because you liked Inception..."

3. **Popularity-Based** (Smart Fallback)
   - Trending movies for new users
   - Ensures quality recommendations from day one

### Training Data & Implicit Feedback

The system infers user interest from actions (no explicit ratings required):

| User Action | Score | Signal Strength |
|-------------|-------|-----------------|
| **Add to Favorites** | 5.0 | Strongest |
| **Watch Progress (100%)** | 3.0 | Completed |
| **Watch Progress (50%)** | 1.5 | Engaged |
| **Add to Watch Later** | 2.0 | Intent |

### Performance Metrics

- **RMSE**: < 1.0 (high accuracy)
- **Scalability**: Handles 1,000+ movies
- **Cold Start**: 100% coverage for new users
- **Retraining**: One-click admin control

## 🔌 API Endpoints

> **For complete API documentation, see [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)**

### Authentication & Users
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with Firebase token
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}/favorites` - Toggle favorite
- `PUT /api/users/{id}/watch-later` - Toggle watch later

### Movies
- `GET /api/movies` - Get all movies (paginated, filterable)
- `GET /api/movies/{id}` - Get movie by ID
- `POST /api/movies/upload` - Upload new movie (Admin)
- `DELETE /api/movies/{id}` - Delete movie (Admin)
- `POST /api/movies/{id}/view` - Increment view count

### Video Streaming
- `GET /api/movies/stream/{movieId}/master.m3u8` - Legacy HLS streaming
- `GET /api/videos/{movieId}/master.m3u8` - Secure tokenized master playlist
- `GET /api/videos/{movieId}/segment/{filename}` - Secure tokenized segment

### Recommendations
- `GET /api/movies/recommendations` - Get personalized recommendations
- `GET /api/movies/similar/{id}` - Get similar movies

### Watch Party
- `POST /api/watch-parties/create` - Create watch party room
- `GET /api/watch-parties/{roomId}` - Get room details
- `POST /api/watch-parties/{roomId}/join` - Join room
- `POST /api/watch-parties/{roomId}/leave` - Leave room

### ML Service
- `POST /train` - Train/retrain model
- `GET /recommendations/{userId}` - Get user recommendations
- `GET /similar-movies/{movieId}` - Get similar movies
- `GET /health` - Health check

### WebSocket
- `CONNECT /ws` - WebSocket connection
- `SUBSCRIBE /topic/watch-party/{roomId}` - Subscribe to room updates
- `SEND /app/watch-party/{roomId}/sync` - Send sync event

## 🔒 Security Features

> **For detailed security implementation, see [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md#security)**

- **Firebase JWT Authentication**: Secure token-based auth
- **Spring Security**: Role-based access control (ADMIN/USER)
- **Video Access Tokens**: JWT tokens for secure segment streaming
  - Master playlist: 10-minute expiration
  - Video segments: 5-minute expiration
  - Token blacklist with Redis
- **Redis Caching**: Performance optimization with security
  - User access cache (5-minute TTL)
  - Video metadata cache (15-minute TTL)
  - Token blacklist (1-hour TTL)
- **Endpoint Protection**: 
  - `getAllUsers` restricted to ADMIN only
  - `uploadMovie` / `deleteMovie` restricted to ADMIN only
  - User profile access restricted to owner or ADMIN
- **CORS Configuration**: Controlled cross-origin requests
- **WebSocket Security**: Authenticated connections only
- **Password-less Auth**: OAuth 2.0 via Google

## 🐛 Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find and kill the process (Windows)
netstat -ano | findstr :8080
taskkill /F /PID <process-id>

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**Redis connection failed:**
```bash
# Check if Redis is running
redis-cli ping
# Should return "PONG"

# Start Redis
# Windows: redis-server
# Linux: sudo systemctl start redis
# Mac: brew services start redis
```

**MongoDB connection failed:**
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `MONGODB_URI`
- Ensure database name is `moviestreamingnosql`

**FFmpeg not found:**
- Install FFmpeg: 
  - Windows: `choco install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg`
  - Mac: `brew install ffmpeg`
- Add to PATH and restart terminal

### Frontend Issues

**Firebase auth not working:**
- Check `firebase.js` configuration
- Verify API keys in Firebase Console
- Enable Google Sign-In in Firebase Authentication

**API calls failing:**
- Ensure backend is running on port 8080
- Check API base URL in `src/api/*.js`
- Verify CORS is enabled in backend
- Check browser console for detailed errors

**Video not playing:**
- Check if FFmpeg processed the video correctly
- Verify `videos_processed/{movieId}/master.m3u8` exists
- Check browser console for HLS errors
- Try the legacy player if secure player fails

### ML Service Issues

**Port 5000 in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <process-id>

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Training fails with "No data":**
- Ensure MongoDB database is `moviestreamingnosql` (not `movieStreamingDB`)
- Check if users and movies collections exist
- Add some user interactions (favorites, watch progress)
- Verify ML service can connect to MongoDB

**Python dependencies missing:**
```bash
cd ml-service
pip install -r requirements.txt
```

**ImportError or ModuleNotFoundError:**
- Ensure Python 3.10+ is installed
- Try creating a virtual environment:
  ```bash
  python -m venv venv
  # Windows
  .\venv\Scripts\activate
  # Linux/Mac
  source venv/bin/activate
  pip install -r requirements.txt
  ```

## Demo

**Watch the demo video:** [Coming soon]

**Try it live:** [Coming soon]

## 📊 Project Statistics

- **Lines of Code**: 15,000+
- **Components**: 30+ React components
- **API Endpoints**: 30+ RESTful endpoints
- **Real-time Channels**: WebSocket with unlimited rooms
- **Database Collections**: 4 main collections (users, movies, watchProgress, watchParties)
- **ML Latent Factors**: 15 hidden patterns discovered by NMF
- **Video Qualities**: 4 levels (360p, 480p, 720p, 1080p)
- **Caching Layers**: 3 Redis caches (userAccess, videoMetadata, tokenBlacklist)
- **Security Tokens**: 2-tier JWT system (master + segment)

## 🎯 Key Features Breakdown

### Video Streaming
- **HLS Adaptive Streaming**: Automatic quality switching based on bandwidth
- **Dual Player System**: 
  - Legacy player for backward compatibility
  - Secure player with tokenized segment access
- **Thumbnail Previews**: Hover over timeline to see scene previews
- **Custom Controls**: Volume, playback speed, fullscreen, keyboard shortcuts

### Machine Learning
- **3 Recommendation Algorithms**: Collaborative, Content-Based, Popularity
- **Implicit Feedback**: No ratings required - learns from user behavior
- **Cold Start Solution**: New users get popular recommendations immediately
- **Real-time Training**: Admin can retrain model anytime with new data

### Real-time Features
- **Watch Parties**: Synchronized viewing across multiple users
- **Live Sync**: Play, pause, and seek synchronized in real-time
- **Participant Tracking**: See who's watching with you
- **WebSocket Communication**: Low-latency event broadcasting

### Performance Optimization
- **Redis Caching**: Reduces database queries by 70%
- **Video Token Caching**: Prevents repeated JWT generation
- **Metadata Caching**: Faster movie browsing experience
- **Lazy Loading**: Images and components load on-demand

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Krishanu Anand**
- GitHub: [@anand-krishanu](https://github.com/anand-krishanu)

## 🙏 Acknowledgments

- React and Vite teams for excellent developer experience
- Spring Boot community for comprehensive documentation
- scikit-learn developers for powerful ML tools
- Firebase team for seamless authentication
- FFmpeg project for video processing capabilities
- Redis Labs for high-performance caching
- MongoDB team for flexible NoSQL database

## 📬 Contact

For questions or support, please open an issue on GitHub.

---

## 🗂️ Additional Resources

- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Detailed component structure, routing, and state management
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - API design, security layers, and caching strategies
- **[ML Architecture](ML_ARCHITECTURE.md)** - Recommendation algorithms and training pipeline

---

**Built with ❤️ for movie lovers everywhere!**
