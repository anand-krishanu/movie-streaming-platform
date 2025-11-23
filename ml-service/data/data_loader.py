import os
from pymongo import MongoClient
from typing import List, Dict, Optional
import pandas as pd
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DataLoader:
    """Loads and preprocesses data from MongoDB"""
    
    def __init__(self):
        # MongoDB connection
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "moviestreamingdb")
        
        try:
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            
            # Test connection first
            self.client.server_info()
            
            # List all databases to help debug
            db_names = self.client.list_database_names()
            logger.info(f"📋 Available databases: {db_names}")
            
            # Get the database
            self.db = self.client.get_database(db_name)
            
            # List collections in this database
            collection_names = self.db.list_collection_names()
            logger.info(f"📋 Collections in {db_name}: {collection_names}")
            
            self.users_collection = self.db.users
            self.movies_collection = self.db.movies
            
            logger.info(f"✅ Connected to MongoDB database: {db_name}")
        except Exception as e:
            logger.warning(f"⚠️ MongoDB connection failed: {e}")
            logger.warning("Service will start but recommendations will not work until MongoDB is available")
            self.client = None
            self.db = None
            self.users_collection = None
            self.movies_collection = None
        
    def get_interaction_matrix(self) -> pd.DataFrame:
        """
        Build user-movie interaction matrix from MongoDB data
        
        Returns:
            DataFrame with columns: user_id, movie_id, score
        """
        if not self.client:
            logger.error("❌ MongoDB not connected")
            return pd.DataFrame(columns=['user_id', 'movie_id', 'score', 'interaction_type'])
            
        logger.info("📊 Building interaction matrix from MongoDB...")
        
        interactions = []
        
        # Get all users
        try:
            users = list(self.users_collection.find())
            logger.info(f"Found {len(users)} users")
        except Exception as e:
            logger.error(f"❌ Failed to fetch users from MongoDB: {e}")
            return pd.DataFrame(columns=['user_id', 'movie_id', 'score', 'interaction_type'])
        
        for user in users:
            user_id = user.get('_id') or user.get('id')
            
            # Favorites = highest score (5 points)
            for movie_id in user.get('favoriteMovieIds', []):
                interactions.append({
                    'user_id': user_id,
                    'movie_id': movie_id,
                    'score': 5.0,
                    'interaction_type': 'favorite'
                })
            
            # Watch later = medium score (2 points)
            for movie_id in user.get('watchLaterMovieIds', []):
                # Skip if already in favorites
                if movie_id not in user.get('favoriteMovieIds', []):
                    interactions.append({
                        'user_id': user_id,
                        'movie_id': movie_id,
                        'score': 2.0,
                        'interaction_type': 'watch_later'
                    })
        
        # Add viewing history from watch progress
        try:
            watch_progress = list(self.db.watchProgress.find())
            for progress in watch_progress:
                user_id = progress.get('userId')
                movie_id = progress.get('movieId')
                
                if not user_id or not movie_id:
                    continue
                
                # Only count if they watched > 10% (engagement signal)
                if progress.get('progress', 0) > 0.1:
                    # Check if not already in favorites or watch later
                    existing = any(
                        i['user_id'] == user_id and i['movie_id'] == movie_id 
                        for i in interactions
                    )
                    if not existing:
                        # Score based on progress (1-3 points)
                        score = min(3.0, progress.get('progress', 0) * 3)
                        interactions.append({
                            'user_id': user_id,
                            'movie_id': movie_id,
                            'score': score,
                            'interaction_type': 'viewed'
                        })
        except Exception as e:
            logger.warning(f"⚠️ Failed to fetch watch progress: {e}")
        
        # Create DataFrame with proper columns
        if len(interactions) == 0:
            logger.warning("⚠️ No interactions found! Model needs data to train.")
            return pd.DataFrame(columns=['user_id', 'movie_id', 'score', 'interaction_type'])
        
        df = pd.DataFrame(interactions)
        
        # Ensure columns exist and are correct type
        df['user_id'] = df['user_id'].astype(str)
        df['movie_id'] = df['movie_id'].astype(str)
        df['score'] = df['score'].astype(float)
        
        logger.info(f"✅ Created interaction matrix: {len(df)} interactions")
        logger.info(f"   Unique users: {df['user_id'].nunique()}, Unique movies: {df['movie_id'].nunique()}")
        
        return df
    
    def get_movies_metadata(self) -> pd.DataFrame:
        """
        Get movie metadata for content-based filtering
        
        Returns:
            DataFrame with movie features
        """
        if not self.client:
            logger.error("❌ MongoDB not connected")
            return pd.DataFrame(columns=['movie_id', 'title', 'genres', 'rating', 'views', 'likes', 'release_year'])
            
        logger.info("🎬 Loading movie metadata...")
        
        try:
            movies = list(self.movies_collection.find())
        except Exception as e:
            logger.error(f"❌ Failed to fetch movies: {e}")
            return pd.DataFrame(columns=['movie_id', 'title', 'genres', 'rating', 'views', 'likes', 'release_year'])
        
        movies_data = []
        for movie in movies:
            try:
                movie_id = str(movie.get('_id') or movie.get('movieId', ''))
                if not movie_id:
                    continue
                    
                movies_data.append({
                    'movie_id': movie_id,
                    'title': movie.get('movieTitle', 'Unknown'),
                    'genres': '|'.join(movie.get('genres', [])) if movie.get('genres') else '',
                    'rating': float(movie.get('imdbRating', 0)),
                    'views': int(movie.get('statistics', {}).get('views', 0)),
                    'likes': int(movie.get('statistics', {}).get('likes', 0)),
                    'release_year': movie.get('releaseDate', datetime.now()).year if movie.get('releaseDate') else None
                })
            except Exception as e:
                logger.warning(f"⚠️ Skipping movie due to error: {e}")
                continue
        
        if len(movies_data) == 0:
            logger.error("❌ No valid movies found in database!")
            return pd.DataFrame(columns=['movie_id', 'title', 'genres', 'rating', 'views', 'likes', 'release_year'])
        
        df = pd.DataFrame(movies_data)
        logger.info(f"✅ Loaded {len(df)} movies")
        
        return df
    
    def get_user_profile(self, user_id: str) -> Dict:
        """Get user profile and interaction history"""
        user = self.users_collection.find_one({'_id': user_id}) or \
               self.users_collection.find_one({'id': user_id})
        
        if not user:
            return {
                'user_id': user_id,
                'favorites': [],
                'watch_later': [],
                'watched': []
            }
        
        return {
            'user_id': user_id,
            'favorites': user.get('favoriteMovieIds', []),
            'watch_later': user.get('watchLaterMovieIds', []),
            'watched': self._get_watched_movies(user_id)
        }
    
    def _get_watched_movies(self, user_id: str) -> List[str]:
        """Get list of movies user has watched"""
        progress = list(self.db.watchProgress.find({'userId': user_id}))
        return [p['movieId'] for p in progress if p.get('progress', 0) > 0.1]
    
    def record_interaction(self, user_id: str, movie_id: str, score: float):
        """Record a new interaction for incremental learning"""
        interaction = {
            'user_id': user_id,
            'movie_id': movie_id,
            'score': score,
            'timestamp': datetime.utcnow(),
            'processed': False
        }
        self.db.ml_feedback.insert_one(interaction)
        logger.info(f"✅ Recorded interaction: {user_id} -> {movie_id} ({score})")
    
    def get_all_movie_ids(self) -> List[str]:
        """Get all available movie IDs"""
        movies = self.movies_collection.find({}, {'_id': 1, 'movieId': 1})
        return [m.get('_id') or m.get('movieId') for m in movies]
