# ML-Based Movie Recommendation System - Setup Guide

## Overview

Your movie streaming platform now has an ML-based recommendation system using:
- **Collaborative Filtering**: Matrix Factorization (NMF)
- **Content-Based Filtering**: Genre similarity
- **Hybrid Approach**: Combined for best results
- **Cold Start Handling**: Popularity fallback for new users

## Architecture

```
Frontend (React) → Spring Boot API → Python ML Service → MongoDB
                         ↓
                    Cached Results
```

---

## Setup Instructions

### 1. Install Python ML Service

```powershell
# Navigate to ml-service directory
cd ml-service

# Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```powershell
# Copy example env file
cp .env.example .env

# Edit .env with your MongoDB URI
# ml-service/.env
MONGO_URI=mongodb://localhost:27017
PORT=5000
```

### 3. Start ML Service

```powershell
cd ml-service
python app.py
```

Service runs on `http://localhost:5000`

### 4. Train Initial Model

```powershell
# Option 1: Using curl (PowerShell)
Invoke-WebRequest -Uri http://localhost:5000/train -Method POST

# Option 2: Using Python
import requests
requests.post('http://localhost:5000/train')

# Option 3: From Spring Boot endpoint
curl -X POST http://localhost:8080/api/movies/ml/train
```

**Note**: You need at least some user interaction data (favorites, watch history) for training to work.

### 5. Verify Setup

```powershell
# Health check
curl http://localhost:5000/health

# Check Spring Boot integration
curl http://localhost:8080/api/movies/recommendations?limit=10
```

---

## Usage

### Backend (Spring Boot)

**Get Recommendations for Current User:**
```java
GET /api/movies/recommendations?limit=10
```

**Get Similar Movies:**
```java
GET /api/movies/{movieId}/similar?limit=10
```

**Trigger Model Training:**
```java
POST /api/movies/ml/train
```

### Frontend (React)

```javascript
import movieApi from './api/movieApi';

// Get personalized recommendations
const recommendations = await movieApi.getRecommendations(10);

// Get similar movies
const similar = await movieApi.getSimilarMovies(movieId, 10);

// Trigger training (admin only)
await movieApi.trainMLModel();
```

---

## How It Works

### Data Collection

The ML service automatically collects user interactions from MongoDB:

| Interaction Type | Score | Source |
|-----------------|-------|---------|
| Favorite | 5.0 | `User.favoriteMovieIds` |
| Watch Later | 2.0 | `User.watchLaterMovieIds` |
| Viewed | 1-3 | `WatchProgress` (based on % watched) |

### Model Training

1. **Build Interaction Matrix**: User-Movie pairs with scores
2. **Matrix Factorization (NMF)**: Finds latent features
3. **Content Similarity**: Calculates genre-based similarity
4. **Save Model**: Persists to `ml-service/saved_models/`

### Recommendation Generation

**For Existing Users:**
- Collaborative filtering using learned user preferences
- Weighted by predicted scores

**For New Users (Cold Start):**
1. If user has favorites → Content-based from those movies
2. Else → Popular movies (most likes + views)

---

## Adding Recommendations to Frontend

### Create Recommendations Page

```javascript
// FRONTEND/src/pages/Recommendations/RecommendationsPage.jsx
import { useEffect, useState } from 'react';
import movieApi from '../../api/movieApi';
import MovieGrid from '../../components/MovieGrid';
import Navbar from '../../components/Navbar';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await movieApi.getRecommendations(20);
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-20">
        <h1 className="text-3xl font-bold mb-6">Recommended for You</h1>
        {loading ? (
          <div>Loading recommendations...</div>
        ) : (
          <MovieGrid movies={recommendations} />
        )}
      </div>
    </div>
  );
}
```

### Add to Home Page

```javascript
// FRONTEND/src/pages/Home/Home.jsx
const [recommendations, setRecommendations] = useState([]);

useEffect(() => {
  const loadRecommendations = async () => {
    try {
      const recs = await movieApi.getRecommendations(10);
      setRecommendations(recs);
    } catch (error) {
      console.log('ML service not available, skipping recommendations');
    }
  };
  loadRecommendations();
}, []);

// In render:
{recommendations.length > 0 && (
  <GenreRow genre="Recommended for You" movies={recommendations} />
)}
```

### Add "Similar Movies" to Player Page

```javascript
// FRONTEND/src/pages/Movie/MoviePlayer.jsx
const [similarMovies, setSimilarMovies] = useState([]);

useEffect(() => {
  const loadSimilar = async () => {
    try {
      const similar = await movieApi.getSimilarMovies(id, 6);
      setSimilarMovies(similar);
    } catch (error) {
      console.log('Could not load similar movies');
    }
  };
  loadSimilar();
}, [id]);

// In render (below video):
{similarMovies.length > 0 && (
  <div className="mt-8">
    <h2 className="text-2xl font-bold mb-4">Similar Movies</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {similarMovies.map(movie => (
        <MovieCard key={movie.movieId} movie={movie} showButtons={false} />
      ))}
    </div>
  </div>
)}
```

---

## Model Retraining

### When to Retrain

- **Daily**: For active platforms with lots of new interactions
- **Weekly**: For smaller platforms
- **On-demand**: After significant data changes

### Automated Retraining (Optional)

**Using Spring Boot Scheduler:**

```java
@Scheduled(cron = "0 0 2 * * *") // 2 AM daily
public void retrainModel() {
    try {
        mlRecommendationService.trainModel();
        log.info("✅ ML model retrained successfully");
    } catch (Exception e) {
        log.error("❌ Failed to retrain model: {}", e.getMessage());
    }
}
```

---

## Troubleshooting

### ML Service Not Starting

```powershell
# Check Python version (3.8+)
python --version

# Check dependencies
pip list | Select-String "fastapi|sklearn|pandas"

# Check port availability
netstat -ano | Select-String "5000"
```

### Training Fails

**Error**: "No interactions found"
- **Solution**: Add some user data first (like movies, watch videos)

**Error**: "Matrix too sparse"
- **Solution**: Need at least 10+ interactions across 3+ users

### Recommendations Empty

**Check ML service health:**
```powershell
curl http://localhost:5000/
```

**Check Spring Boot logs:**
```
ML service unavailable: Connection refused
```
- **Solution**: Ensure ML service is running on port 5000

---

## Performance Optimization

### Caching Recommendations

```java
@Cacheable(value = "recommendations", key = "#userId")
public List<Movie> getRecommendationsForUser(String userId, int limit) {
    // ...
}
```

### Batch Predictions

For homepage, pre-compute recommendations for all users:

```python
# ml-service/batch_predict.py
for user in all_users:
    recs = recommender.get_recommendations(user.id)
    cache.set(f"recs:{user.id}", recs, ttl=3600)
```

---

## Production Deployment

### Docker Setup (Optional)

```dockerfile
# ml-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

### Environment Variables

```bash
MONGO_URI=mongodb://production-host:27017
ML_SERVICE_URL=http://ml-service:5000
```

---

## Next Steps

1. ✅ Start ML service
2. ✅ Train initial model
3. ✅ Add recommendations to home page
4. ✅ Add similar movies to player
5. 🔄 Set up automated retraining
6. 🔄 Add caching for performance
7. 🔄 Monitor model accuracy

---

## Questions?

- Model not accurate? → Need more user interaction data
- Slow recommendations? → Add caching or increase `n_components`
- Cold start issues? → Ensure popular movies fallback works
