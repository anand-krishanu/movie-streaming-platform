from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from models.recommender import RecommenderSystem
from data.data_loader import DataLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Movie Recommendation ML Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
data_loader = DataLoader()
recommender = RecommenderSystem(data_loader)

# Response models
class RecommendationResponse(BaseModel):
    movie_id: str
    score: float
    reason: str

class TrainResponse(BaseModel):
    status: str
    message: str
    metrics: dict

@app.on_event("startup")
async def startup_event():
    """Load model on startup if exists"""
    logger.info("🚀 Starting ML Recommendation Service")
    try:
        recommender.load_model()
        logger.info("✅ Model loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ No existing model found: {e}")

@app.get("/")
async def root():
    return {
        "service": "Movie Recommendation ML Service",
        "status": "running",
        "model_trained": recommender.is_trained()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/train")
async def train_model():
    """Train/retrain the recommendation model"""
    try:
        logger.info("🎯 Starting model training...")
        metrics = recommender.train()
        
        return TrainResponse(
            status="success",
            message="Model trained successfully",
            metrics=metrics
        )
    except ValueError as e:
        logger.warning(f"⚠️ Training skipped: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations/{user_id}")
async def get_recommendations(
    user_id: str,
    limit: int = 10,
    exclude_watched: bool = True
) -> List[RecommendationResponse]:
    """Get personalized recommendations for a user"""
    
    if not recommender.is_trained():
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Please call /train first"
        )
    
    try:
        recommendations = recommender.get_recommendations(
            user_id=user_id,
            n_recommendations=limit,
            exclude_watched=exclude_watched
        )
        
        return [
            RecommendationResponse(
                movie_id=rec["movie_id"],
                score=rec["score"],
                reason=rec["reason"]
            )
            for rec in recommendations
        ]
    except Exception as e:
        logger.error(f"❌ Recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/similar-movies/{movie_id}")
async def get_similar_movies(
    movie_id: str,
    limit: int = 10
) -> List[RecommendationResponse]:
    """Get movies similar to a given movie"""
    
    if not recommender.is_trained():
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Please call /train first"
        )
    
    try:
        similar = recommender.get_similar_movies(
            movie_id=movie_id,
            n_similar=limit
        )
        
        return [
            RecommendationResponse(
                movie_id=sim["movie_id"],
                score=sim["score"],
                reason=sim["reason"]
            )
            for sim in similar
        ]
    except Exception as e:
        logger.error(f"❌ Similar movies lookup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def record_feedback(user_id: str, movie_id: str, rating: float):
    """Record user feedback for incremental learning"""
    try:
        # Store feedback in MongoDB for next training cycle
        data_loader.record_interaction(user_id, movie_id, rating)
        return {"status": "success", "message": "Feedback recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
