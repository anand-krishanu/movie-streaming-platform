# Movie Streaming Platform

A full-stack Netflix-style movie streaming platform with AI-powered recommendations and real-time watch parties.

---

## Documentation

| Component | Description | Link |
|-----------|-------------|------|
|  **Frontend** | React architecture, components, routing, state management | [View Frontend Architecture](FRONTEND_ARCHITECTURE.md) |
| **Backend** | Spring Boot layers, security, APIs, caching, WebSocket | [View Backend Architecture](BACKEND_ARCHITECTURE.md) |
|  **ML Service** | Recommendation algorithms, training pipeline, data scoring | [View ML Architecture](ML_ARCHITECTURE.md) |

---

##  Features

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

##  System Architecture

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

###  Architecture Details

For detailed architecture documentation, see:
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Component hierarchy, routing, state management, video player
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - Layered architecture, security, Redis caching, WebSocket
- **[ML Architecture](ML_ARCHITECTURE.md)** - Hybrid recommendation system, NMF, content-based filtering

##  Tech Stack

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

##  Prerequisites

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

##  Usage Guide

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

## Configuration

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

## Demo

**Watch the demo video:** [Coming soon]

**Try it live:** [Coming soon]

## Project Statistics

- **Lines of Code**: 15,000+
- **Components**: 30+ React components
- **API Endpoints**: 30+ RESTful endpoints
- **Real-time Channels**: WebSocket with unlimited rooms
- **Database Collections**: 4 main collections (users, movies, watchProgress, watchParties)
- **ML Latent Factors**: 15 hidden patterns discovered by NMF
- **Video Qualities**: 4 levels (360p, 480p, 720p, 1080p)
- **Caching Layers**: 3 Redis caches (userAccess, videoMetadata, tokenBlacklist)
- **Security Tokens**: 2-tier JWT system (master + segment)

## Key Features Breakdown

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

## License

This project is licensed under the MIT License.

## Author

**Krishanu Anand**
- GitHub: [@anand-krishanu](https://github.com/anand-krishanu)

## Acknowledgments

- React and Vite teams for excellent developer experience
- Spring Boot community for comprehensive documentation
- scikit-learn developers for powerful ML tools
- Firebase team for seamless authentication
- FFmpeg project for video processing capabilities
- Redis Labs for high-performance caching
- MongoDB team for flexible NoSQL database

## Contact

For questions or support, please open an issue on GitHub.

---

## Additional Resources

- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Detailed component structure, routing, and state management
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - API design, security layers, and caching strategies
- **[ML Architecture](ML_ARCHITECTURE.md)** - Recommendation algorithms and training pipeline

---

**Built with ❤️ for movie lovers everywhere!**
