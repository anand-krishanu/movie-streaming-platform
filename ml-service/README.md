# ML Recommendation Service

Python-based machine learning service for movie recommendations.

## Features

- **Collaborative Filtering**: Matrix Factorization (NMF) for personalized recommendations
- **Content-Based Filtering**: Genre similarity for better recommendations
- **Hybrid Approach**: Combines both methods for optimal results
- **Cold Start Handling**: Popularity-based fallback for new users

## Setup

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 3. Run the Service

```bash
python app.py
```

Service will start on `http://localhost:5000`

## API Endpoints

### Train Model
```bash
POST http://localhost:5000/train
```
Trains the recommendation model using data from MongoDB.

### Get Recommendations
```bash
GET http://localhost:5000/recommendations/{user_id}?limit=10
```
Returns personalized movie recommendations for a user.

### Get Similar Movies
```bash
GET http://localhost:5000/similar-movies/{movie_id}?limit=10
```
Returns movies similar to the given movie.

### Health Check
```bash
GET http://localhost:5000/health
```

## How It Works

1. **Data Collection**: Fetches user interactions from MongoDB (favorites, watch later, view progress)
2. **Scoring**: Assigns scores to interactions (favorites=5, watch later=2, viewed=1-3)
3. **Matrix Factorization**: Uses NMF to find latent patterns in user-movie interactions
4. **Content Similarity**: Calculates genre-based similarity between movies
5. **Hybrid Recommendations**: Combines collaborative and content-based scores

## Model Retraining

The model should be retrained periodically (e.g., daily) as new user interactions are collected:

```bash
curl -X POST http://localhost:5000/train
```

## Integration with Spring Boot

Add these endpoints to your MovieController to proxy ML service:

```java
@GetMapping("/recommendations")
public ResponseEntity<List<Movie>> getRecommendations() {
    String userId = getCurrentUserId();
    // Call ML service
    List<String> movieIds = mlService.getRecommendations(userId);
    List<Movie> movies = movieRepository.findAllById(movieIds);
    return ResponseEntity.ok(movies);
}
```
