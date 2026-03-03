# Movie Streaming Platform

A full-stack Netflix-style movie streaming platform with AI-powered recommendations and real-time watch parties.

---

## 🚀 Quick Start (Fresh Machine)

**New to this project? Start here!**

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/movie-streaming-platform.git
cd movie-streaming-platform

# 2. Run automated setup (Windows)
.\setup.ps1

# Or for macOS/Linux
chmod +x setup.sh && ./setup.sh
```

For detailed step-by-step instructions, see [**DEPLOYMENT-GUIDE.md**](DEPLOYMENT-GUIDE.md)

---

## 📚 Documentation

| Component | Description | Link |
|-----------|-------------|------|
| 🚀 **Fresh Setup** | Step-by-step guide for deploying on a brand new machine | [Deployment Guide](DEPLOYMENT-GUIDE.md) |
|  **Setup Guide** | Complete setup and deployment instructions (Docker & Kubernetes) | [HOW-TO-RUN.md](HOW-TO-RUN.md) |
|  **Frontend** | React architecture, components, routing, state management | [Frontend Architecture](FRONTEND_ARCHITECTURE.md) |
| **Backend** | Spring Boot layers, security, APIs, caching, WebSocket | [Backend Architecture](BACKEND_ARCHITECTURE.md) |
|  **ML Service** | Recommendation algorithms, training pipeline, data scoring | [ML Architecture](ML_ARCHITECTURE.md) |

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

##  Getting Started

### Quick Start

Ready to run the application? See the complete setup and deployment guide:

**📖 [HOW-TO-RUN.md](HOW-TO-RUN.md)** - Complete guide for Docker Compose and Kubernetes deployment

### Prerequisites

Before you begin, you'll need:

- **Docker** & **Docker Compose** (for containerized deployment)
- **MongoDB** (running locally on your machine)
- **Kubernetes** (Minikube + kubectl) - for K8s deployment
- **Firebase Account** (for Google authentication)

**See [HOW-TO-RUN.md](HOW-TO-RUN.md) for detailed installation instructions and setup steps.**

### Deployment Options

This platform supports two deployment methods:

| Method | Use Case | Complexity | Documentation |
|--------|----------|------------|---------------|
| **Docker Compose** | Local development, testing | Easy | [Docker Guide](HOW-TO-RUN.md#running-with-docker-compose) |
| **Kubernetes** | Production-like, learning K8s | Moderate | [Kubernetes Guide](HOW-TO-RUN.md#running-with-kubernetes) |

Both methods run the same 4 services: Frontend (React), Backend (Spring Boot), ML Service (FastAPI), and Redis (cache).

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

For detailed instructions on running and using the application, see **[HOW-TO-RUN.md](HOW-TO-RUN.md)**.

### Quick Overview

**For Users:**
- Sign in with Google
- Browse and search movies by genre
- Watch with adaptive quality streaming (360p-1080p)
- Add to Favorites, Watch Later, or view Watch History
- Get AI-powered personalized recommendations
- Create Watch Parties for synchronized viewing with friends

**For Admins:**
- Upload movies with metadata (title, genres, year, rating, poster)
- System auto-processes videos to HLS format with multiple qualities
- Train ML recommendation model with latest user data
- Manage content and view statistics

**See the [complete usage guide in HOW-TO-RUN.md](HOW-TO-RUN.md#using-the-application) for step-by-step instructions.**

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

- **[HOW-TO-RUN.md](HOW-TO-RUN.md)** - Complete setup guide for Docker and Kubernetes deployment
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Detailed component structure, routing, and state management
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - API design, security layers, and caching strategies
- **[ML Architecture](ML_ARCHITECTURE.md)** - Recommendation algorithms and training pipeline
- **[VIDEO-ACCESS-FIX.md](VIDEO-ACCESS-FIX.md)** - Docker volume mounts and video storage explanation

---

**Built with ❤️ for movie lovers everywhere!**
