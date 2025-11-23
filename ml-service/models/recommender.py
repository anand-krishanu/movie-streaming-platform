import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import pickle
import os
import logging

logger = logging.getLogger(__name__)

class RecommenderSystem:
    """
    Hybrid recommendation system using:
    1. Collaborative Filtering (Matrix Factorization with NMF)
    2. Content-Based Filtering (Genre similarity)
    3. Popularity-Based (Fallback for cold start)
    """
    
    def __init__(self, data_loader):
        self.data_loader = data_loader
        self.model = None
        self.user_features = None
        self.movie_features = None
        self.user_id_map = {}
        self.movie_id_map = {}
        self.reverse_movie_map = {}
        self.interaction_matrix = None
        self.movies_metadata = None
        self.content_similarity = None
        
        # Model parameters
        self.n_components = 15  # Latent factors
        self.model_path = "saved_models/recommender.pkl"
        
    def is_trained(self) -> bool:
        """Check if model is trained"""
        return self.model is not None
    
    def train(self) -> Dict:
        """Train the recommendation model"""
        logger.info("🎯 Starting model training...")
        
        # 1. Load interaction data
        interactions_df = self.data_loader.get_interaction_matrix()
        self.movies_metadata = self.data_loader.get_movies_metadata()
        
        if len(interactions_df) < 10:
            logger.warning("⚠️ Very few interactions. Model may not be accurate.")
        
        # 2. Create user-movie matrix
        self.interaction_matrix = self._create_interaction_matrix(interactions_df)
        
        # 3. Train collaborative filtering model (NMF)
        logger.info("🔄 Training collaborative filtering model...")
        self.model = NMF(
            n_components=self.n_components,
            init='random',
            random_state=42,
            max_iter=300,
            alpha_W=0.01,
            alpha_H=0.01
        )
        
        # Fit the model
        self.user_features = self.model.fit_transform(self.interaction_matrix)
        self.movie_features = self.model.components_.T
        
        # 4. Build content-based similarity matrix
        logger.info("🔄 Building content similarity matrix...")
        self.content_similarity = self._build_content_similarity()
        
        # 5. Calculate training metrics
        reconstruction = self.user_features @ self.movie_features.T
        rmse = np.sqrt(np.mean((self.interaction_matrix - reconstruction) ** 2))
        
        # 6. Save model
        self._save_model()
        
        metrics = {
            "rmse": float(rmse),
            "n_users": len(self.user_id_map),
            "n_movies": len(self.movie_id_map),
            "n_interactions": len(interactions_df),
            "sparsity": float(1 - len(interactions_df) / (len(self.user_id_map) * len(self.movie_id_map)))
        }
        
        logger.info(f"✅ Training complete! RMSE: {rmse:.4f}")
        logger.info(f"📊 Metrics: {metrics}")
        
        return metrics
    
    def _create_interaction_matrix(self, interactions_df: pd.DataFrame) -> np.ndarray:
        """Convert interactions DataFrame to user-movie matrix"""
        
        # Check if DataFrame is empty
        if len(interactions_df) == 0:
            logger.error("❌ No interactions data available. Cannot train model.")
            raise ValueError("No interaction data found. Add users and interactions first.")
        
        # Ensure required columns exist
        if 'user_id' not in interactions_df.columns or 'movie_id' not in interactions_df.columns:
            logger.error(f"❌ Missing required columns. Found: {interactions_df.columns.tolist()}")
            raise ValueError(f"DataFrame missing required columns. Expected 'user_id', 'movie_id', 'score'. Got: {interactions_df.columns.tolist()}")
        
        # Create ID mappings
        unique_users = interactions_df['user_id'].unique()
        unique_movies = interactions_df['movie_id'].unique()
        
        self.user_id_map = {uid: idx for idx, uid in enumerate(unique_users)}
        self.movie_id_map = {mid: idx for idx, mid in enumerate(unique_movies)}
        self.reverse_movie_map = {idx: mid for mid, idx in self.movie_id_map.items()}
        
        # Create matrix
        n_users = len(unique_users)
        n_movies = len(unique_movies)
        matrix = np.zeros((n_users, n_movies))
        
        for _, row in interactions_df.iterrows():
            user_idx = self.user_id_map[row['user_id']]
            movie_idx = self.movie_id_map[row['movie_id']]
            matrix[user_idx, movie_idx] = row['score']
        
        logger.info(f"📊 Matrix shape: {matrix.shape}, Sparsity: {(matrix == 0).sum() / matrix.size:.2%}")
        
        return matrix
    
    def _build_content_similarity(self) -> np.ndarray:
        """Build content-based similarity matrix using genres"""
        
        # Create genre feature matrix
        from sklearn.feature_extraction.text import CountVectorizer
        
        # Filter metadata for movies in our training set
        metadata = self.movies_metadata[
            self.movies_metadata['movie_id'].isin(self.movie_id_map.keys())
        ].copy()
        
        # Order by movie_id_map
        metadata = metadata.set_index('movie_id')
        metadata = metadata.loc[[self.reverse_movie_map[i] for i in range(len(self.movie_id_map))]]
        
        # Vectorize genres
        vectorizer = CountVectorizer(token_pattern=r'[^|]+')
        genre_matrix = vectorizer.fit_transform(metadata['genres'].fillna(''))
        
        # Calculate cosine similarity
        similarity = cosine_similarity(genre_matrix)
        
        logger.info(f"✅ Built content similarity matrix: {similarity.shape}")
        
        return similarity
    
    def get_recommendations(
        self,
        user_id: str,
        n_recommendations: int = 10,
        exclude_watched: bool = True
    ) -> List[Dict]:
        """Get personalized recommendations for a user"""
        
        # Get user profile
        user_profile = self.data_loader.get_user_profile(user_id)
        
        # Check if user exists in training data
        if user_id in self.user_id_map:
            # Existing user - use collaborative filtering
            recommendations = self._collaborative_recommendations(
                user_id,
                n_recommendations * 2  # Get more to filter
            )
        else:
            # New user - use content-based + popularity
            logger.info(f"🆕 New user {user_id}, using cold-start strategy")
            recommendations = self._cold_start_recommendations(
                user_profile,
                n_recommendations * 2
            )
        
        # Exclude already watched/favorited movies
        if exclude_watched:
            watched_ids = set(
                user_profile['favorites'] +
                user_profile['watch_later'] +
                user_profile['watched']
            )
            recommendations = [
                r for r in recommendations
                if r['movie_id'] not in watched_ids
            ]
        
        # Return top N
        return recommendations[:n_recommendations]
    
    def _collaborative_recommendations(self, user_id: str, n: int) -> List[Dict]:
        """Collaborative filtering recommendations"""
        
        user_idx = self.user_id_map[user_id]
        
        # Predict scores for all movies
        user_vec = self.user_features[user_idx]
        predicted_scores = user_vec @ self.movie_features.T
        
        # Get top N
        top_indices = np.argsort(predicted_scores)[::-1][:n]
        
        recommendations = []
        for idx in top_indices:
            movie_id = self.reverse_movie_map[idx]
            recommendations.append({
                'movie_id': movie_id,
                'score': float(predicted_scores[idx]),
                'reason': 'Based on your preferences'
            })
        
        return recommendations
    
    def _cold_start_recommendations(self, user_profile: Dict, n: int) -> List[Dict]:
        """Recommendations for new users (cold start)"""
        
        recommendations = []
        
        # If user has some favorites, use content-based
        if user_profile['favorites']:
            # Find similar movies to their favorites
            for fav_id in user_profile['favorites'][:3]:  # Use top 3 favorites
                if fav_id in self.movie_id_map:
                    similar = self.get_similar_movies(fav_id, n_similar=5)
                    recommendations.extend(similar)
        
        # Add popular movies
        popular = self._get_popular_movies(n)
        recommendations.extend(popular)
        
        # Remove duplicates and sort by score
        seen = set()
        unique_recs = []
        for rec in recommendations:
            if rec['movie_id'] not in seen:
                seen.add(rec['movie_id'])
                unique_recs.append(rec)
        
        return sorted(unique_recs, key=lambda x: x['score'], reverse=True)[:n]
    
    def get_similar_movies(self, movie_id: str, n_similar: int = 10) -> List[Dict]:
        """Find movies similar to a given movie"""
        
        if movie_id not in self.movie_id_map:
            logger.warning(f"Movie {movie_id} not in training data")
            return self._get_popular_movies(n_similar)
        
        movie_idx = self.movie_id_map[movie_id]
        
        # Combine collaborative and content-based similarity
        # Collaborative: cosine similarity in latent space
        movie_vec = self.movie_features[movie_idx]
        collab_sim = cosine_similarity([movie_vec], self.movie_features)[0]
        
        # Content: genre similarity
        content_sim = self.content_similarity[movie_idx]
        
        # Hybrid: weighted combination
        hybrid_sim = 0.6 * collab_sim + 0.4 * content_sim
        
        # Get top similar (excluding itself)
        similar_indices = np.argsort(hybrid_sim)[::-1][1:n_similar+1]
        
        recommendations = []
        for idx in similar_indices:
            recommendations.append({
                'movie_id': self.reverse_movie_map[idx],
                'score': float(hybrid_sim[idx]),
                'reason': 'Similar content and user preferences'
            })
        
        return recommendations
    
    def _get_popular_movies(self, n: int = 10) -> List[Dict]:
        """Get popular movies as fallback"""
        
        # Calculate popularity score
        self.movies_metadata['popularity'] = (
            self.movies_metadata['likes'] * 2 +
            self.movies_metadata['views']
        )
        
        # Get top popular
        popular = self.movies_metadata.nlargest(n, 'popularity')
        
        return [
            {
                'movie_id': row['movie_id'],
                'score': float(row['popularity'] / 100),  # Normalize
                'reason': 'Popular movie'
            }
            for _, row in popular.iterrows()
        ]
    
    def _save_model(self):
        """Save trained model to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'user_features': self.user_features,
            'movie_features': self.movie_features,
            'user_id_map': self.user_id_map,
            'movie_id_map': self.movie_id_map,
            'reverse_movie_map': self.reverse_movie_map,
            'interaction_matrix': self.interaction_matrix,
            'content_similarity': self.content_similarity
        }
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"💾 Model saved to {self.model_path}")
    
    def load_model(self):
        """Load trained model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"No model found at {self.model_path}")
        
        with open(self.model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.user_features = model_data['user_features']
        self.movie_features = model_data['movie_features']
        self.user_id_map = model_data['user_id_map']
        self.movie_id_map = model_data['movie_id_map']
        self.reverse_movie_map = model_data['reverse_movie_map']
        self.interaction_matrix = model_data['interaction_matrix']
        self.content_similarity = model_data['content_similarity']
        
        # Reload metadata
        self.movies_metadata = self.data_loader.get_movies_metadata()
        
        logger.info(f"✅ Model loaded from {self.model_path}")
