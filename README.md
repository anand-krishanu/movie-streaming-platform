#  Movie Streaming Platform

A full-stack Netflix-style movie streaming platform with AI-powered recommendations and real-time watch parties.

## Features

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

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   React     │ ───► │ Spring Boot  │ ───► │  MongoDB   │
│  (Frontend) │      │  (Backend)   │      │ (Database) │
│   :5173     │ ◄─── │    :8080     │ ◄─── │            │
└─────────────┘      └──────────────┘      └────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │Python FastAPI│
                     │ (ML Service) │
                     │    :5000     │
                     └──────────────┘
```

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Video Player**: Custom HLS Player with Thumbnail Previews
- **Real-time**: STOMP WebSocket Client
- **HTTP Client**: Axios
- **UI Components**: React Icons, React Toastify

### Backend
- **Framework**: Spring Boot 3.x (Java)
- **Security**: Spring Security + Firebase Admin SDK + Custom Auth Filters
- **Database**: MongoDB (Spring Data MongoDB)
- **WebSocket**: Spring WebSocket (STOMP protocol)
- **Video Processing**: FFmpeg (HLS segmentation + Thumbnail generation)
- **Build Tool**: Maven

### ML Service
- **Framework**: FastAPI (Python)
- **ML Libraries**: scikit-learn, Pandas, NumPy
- **Algorithm**: Non-negative Matrix Factorization (NMF)
- **Database**: PyMongo
- **Server**: Uvicorn

### Database
- **Type**: MongoDB (NoSQL)
- **Collections**: users, movies, watchProgress, watch_parties

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js**: v18+ and npm
- **Java**: JDK 17+
- **Maven**: 3.8+
- **Python**: 3.10+
- **MongoDB**: 5.0+ (running locally or remote)
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

## Usage Guide

### For Users

1. **Login**: Click "Sign in with Google"
2. **Browse Movies**: Explore by genre or search
3. **Watch Movies**: Click any movie to start streaming
4. **Add to Favorites**: Click the heart icon
5. **Save for Later**: Add to "Watch Later" list
6. **Get Recommendations**: Check "For You" section for personalized picks
7. **Watch Together**: Click "Watch Together" to create a room and share the link with friends

### For Admins

1. **Login as Admin**: Use an admin account
2. **Upload Movie**:
   - Go to Admin Dashboard
   - Fill in movie details (title, description, genres, etc.)
   - Upload video file (MP4, MKV, AVI)
   - System auto-processes video to HLS format
3. **Train ML Model**: Click "Train Model" to update recommendations with latest user data
4. **View Statistics**: Check user engagement metrics

## Configuration

### Backend Configuration (`application.properties`)

```properties
server.port=8080
spring.data.mongodb.uri=${MONGODB_URI}
video.upload.dir=${VIDEO_UPLOAD_DIR}
video.processed.dir=${VIDEO_PROCESSED_DIR}
ml.service.url=http://localhost:5000
spring.servlet.multipart.max-file-size=2GB
```

### Frontend Configuration

- API Base URL: Set in `FRONTEND/src/api/axiosInstance.js` (default: `http://localhost:8080/api`)
- WebSocket URL: Set in `FRONTEND/src/utils/websocket.js` (default: `http://localhost:8080/ws`)

## ML Model Details

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

### Training Data

- **Favorites**: 5 points (strong signal)
- **Watch Later**: 2 points (medium interest)
- **Watch Progress**: 1-3 points (based on % watched)

### Performance Metrics

- **RMSE**: < 1.0 (high accuracy)
- **Scalability**: Handles 1,000+ movies
- **Cold Start**: 100% coverage for new users
- **Retraining**: One-click admin control

## API Endpoints

### Movies API
- `GET /api/movies` - Get all movies (paginated)
- `GET /api/movies/{id}` - Get movie by ID
- `POST /api/movies/upload` - Upload new movie (Admin)
- `DELETE /api/movies/{id}` - Delete movie (Admin)
- `GET /api/movies/stream/{movieId}/{fileName}` - Stream video (HLS)
- `POST /api/movies/{id}/view` - Increment view count

### User API
- `POST /api/auth/sync` - Sync Firebase user with backend
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}/favorites` - Toggle favorite
- `PUT /api/users/{id}/watch-later` - Toggle watch later

### Recommendations API
- `GET /api/movies/recommendations` - Get personalized recommendations
- `GET /api/movies/similar/{id}` - Get similar movies

### Watch Party API
- `POST /api/watch-party/create` - Create watch party room
- `GET /api/watch-party/{roomId}` - Get room details
- `POST /api/watch-party/{roomId}/join` - Join room
- `POST /api/watch-party/{roomId}/leave` - Leave room

### ML Service API
- `POST /train` - Train/retrain model
- `GET /recommendations/{userId}` - Get user recommendations
- `GET /similar-movies/{movieId}` - Get similar movies
- `GET /health` - Health check

### WebSocket
- `CONNECT /ws` - WebSocket connection
- `SUBSCRIBE /topic/watch-party/{roomId}` - Subscribe to room updates
- `SEND /app/watch-party/{roomId}/sync` - Send sync event

## Security Features

- **Firebase JWT Authentication**: Secure token-based auth
- **Spring Security**: Role-based access control (ADMIN/USER)
- **Endpoint Protection**: 
  - `getAllUsers` restricted to ADMIN only
  - `uploadMovie` / `deleteMovie` restricted to ADMIN only
  - User profile access restricted to owner or ADMIN
- **CORS Configuration**: Controlled cross-origin requests
- **WebSocket Security**: Authenticated connections only
- **Password-less Auth**: OAuth 2.0 via Google

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find and kill the process
netstat -ano | findstr :8080
taskkill /F /PID <process-id>
```

**MongoDB connection failed:**
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `MONGODB_URI`
- Ensure database name is `moviestreamingnosql`

**FFmpeg not found:**
- Install FFmpeg: `choco install ffmpeg` (Windows) or download from [ffmpeg.org](https://ffmpeg.org)
- Add to PATH

### Frontend Issues

**Firebase auth not working:**
- Check `firebase.js` configuration
- Verify API keys in Firebase Console
- Enable Google Sign-In in Firebase Authentication

**API calls failing:**
- Ensure backend is running on port 8080
- Check `axiosInstance.js` baseURL
- Verify CORS is enabled in backend

### ML Service Issues

**Port 5000 in use:**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /F /PID <process-id>
```

**Training fails with "No data":**
- Ensure MongoDB database is `moviestreamingnosql` (not `movieStreamingDB`)
- Check if users and movies collections exist
- Add some user interactions (favorites, watch progress)

**Python dependencies missing:**
```bash
pip install -r requirements.txt
```

## Demo

**Watch the demo video:** [Coming soon]

**Try it live:** [Coming soon]

## Project Statistics

- **Lines of Code**: 15,000+
- **Components**: 30+ React components
- **API Endpoints**: 30+ RESTful endpoints
- **Real-time Channels**: WebSocket with unlimited rooms
- **Database Collections**: 4 main collections
- **ML Latent Factors**: 15 hidden patterns
- **Video Qualities**: 4 levels (360p-1080p)

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Author

**Krishanu Anand**
- GitHub: [@anand-krishanu](https://github.com/anand-krishanu)

## Acknowledgments

- React and Vite teams
- Spring Boot community
- scikit-learn developers
- Firebase team
- FFmpeg project

## Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for movie lovers everywhere!**
