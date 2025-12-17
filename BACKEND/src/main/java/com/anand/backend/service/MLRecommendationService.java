package com.anand.backend.service;

import com.anand.backend.entity.Movie;
import com.anand.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for interacting with the Machine Learning (ML) microservice.
 * <p>
 * This service acts as a client to the external Python-based ML service. It handles:
 * <ul>
 *   <li>Fetching personalized movie recommendations for users.</li>
 *   <li>Retrieving similar movies based on content or collaborative filtering.</li>
 *   <li>Triggering model retraining tasks.</li>
 *   <li>Providing fallback recommendations (e.g., popular movies) when the ML service is unavailable.</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MLRecommendationService {

    private final MovieRepository movieRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    /**
     * Retrieves personalized movie recommendations for a specific user.
     * <p>
     * If the ML service is unavailable or returns no results, this method falls back
     * to returning the most popular movies to ensure a consistent user experience.
     * </p>
     *
     * @param userId The unique identifier of the user.
     * @param limit  The maximum number of recommendations to return.
     * @return A list of recommended Movie entities.
     */
    public List<Movie> getRecommendationsForUser(String userId, int limit) {
        try {
            log.info("Fetching ML recommendations for user: {}", userId);

            // Call ML service
            List<RecommendationResponse> recommendations = restClient.get()
                    .uri(mlServiceUrl + "/recommendations/{userId}?limit={limit}", userId, limit)
                    .retrieve()
                    .onStatus(status -> status.value() == 503, (request, response) -> {
                        log.warn("ML model not trained yet (503), using fallback");
                    })
                    .body(new ParameterizedTypeReference<List<RecommendationResponse>>() {});

            if (recommendations == null || recommendations.isEmpty()) {
                log.warn("No recommendations from ML service, falling back to popular movies");
                return getFallbackRecommendations(limit);
            }

            // Extract movie IDs
            List<String> movieIds = recommendations.stream()
                    .map(RecommendationResponse::getMovie_id)
                    .collect(Collectors.toList());

            // Fetch movies from database
            List<Movie> movies = new ArrayList<>();
            for (String movieId : movieIds) {
                movieRepository.findById(movieId).ifPresent(movies::add);
            }

            log.info("Retrieved {} recommended movies", movies.size());
            return movies;

        } catch (Exception e) {
            log.warn("ML service error: {} - Using fallback recommendations", e.getMessage());
            return getFallbackRecommendations(limit);
        }
    }

    /**
     * Retrieves a list of movies similar to the specified movie.
     *
     * @param movieId The unique identifier of the source movie.
     * @param limit   The maximum number of similar movies to return.
     * @return A list of similar Movie entities.
     */
    public List<Movie> getSimilarMovies(String movieId, int limit) {
        try {
            log.info("Fetching similar movies for: {}", movieId);

            List<RecommendationResponse> similar = restClient.get()
                    .uri(mlServiceUrl + "/similar-movies/{movieId}?limit={limit}", movieId, limit)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<RecommendationResponse>>() {});

            if (similar == null || similar.isEmpty()) {
                return new ArrayList<>();
            }

            List<String> movieIds = similar.stream()
                    .map(RecommendationResponse::getMovie_id)
                    .collect(Collectors.toList());

            List<Movie> movies = new ArrayList<>();
            for (String id : movieIds) {
                movieRepository.findById(id).ifPresent(movies::add);
            }

            return movies;

        } catch (RestClientException e) {
            log.error("Failed to get similar movies: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Triggers the training process for the ML model.
     * <p>
     * This is typically called after significant data changes (e.g., new user interactions)
     * to ensure the recommendations remain up-to-date.
     * </p>
     *
     * @return A status message indicating the result of the training initiation.
     */
    public String trainModel() {
        try {
            log.info("Triggering ML model training...");

            TrainResponse response = restClient.post()
                    .uri(mlServiceUrl + "/train")
                    .retrieve()
                    .body(TrainResponse.class);

            if (response != null) {
                log.info("Training completed: {}", response.getMessage());
                return response.getMessage();
            }

            return "Training initiated";

        } catch (RestClientException e) {
            log.error("Failed to train model: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable");
        }
    }

    /**
     * Checks the health status of the ML service.
     *
     * @return true if the service is healthy and reachable, false otherwise.
     */
    public boolean isMLServiceHealthy() {
        try {
            String response = restClient.get()
                    .uri(mlServiceUrl + "/health")
                    .retrieve()
                    .body(String.class);
            return response != null && response.contains("healthy");
        } catch (RestClientException e) {
            return false;
        }
    }

    /**
     * Generates fallback recommendations based on movie popularity.
     * <p>
     * This method is used when the ML service is unavailable or cannot provide recommendations.
     * It sorts movies by a calculated popularity score (views + likes * 2).
     * </p>
     *
     * @param limit The maximum number of movies to return.
     * @return A list of popular Movie entities.
     */
    private List<Movie> getFallbackRecommendations(int limit) {
        log.info("Using fallback recommendations (popular movies)");
        
        return movieRepository.findAll().stream()
                .sorted((a, b) -> {
                    long scoreA = getPopularityScore(a);
                    long scoreB = getPopularityScore(b);
                    return Long.compare(scoreB, scoreA);
                })
                .limit(limit)
                .collect(Collectors.toList());
    }

    private long getPopularityScore(Movie movie) {
        if (movie.getStatistics() == null) return 0;
        return movie.getStatistics().getLikes() * 2 + movie.getStatistics().getViews();
    }

    // Response DTOs
    private static class RecommendationResponse {
        private String movie_id;
        private double score;
        private String reason;

        public String getMovie_id() { return movie_id; }
        public void setMovie_id(String movie_id) { this.movie_id = movie_id; }
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    private static class TrainResponse {
        private String status;
        private String message;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
