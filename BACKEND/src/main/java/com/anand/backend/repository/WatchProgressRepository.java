package com.anand.backend.repository;

import com.anand.backend.entity.WatchProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for tracking user playback progress via {@link WatchProgress}.
 * <p>
 * This repository enables "continue watching" functionality and watch history tracking.
 * It leverages compound indexes defined on the entity to ensure efficient lookups
 * by user and content combinations.
 */
public interface WatchProgressRepository extends MongoRepository<WatchProgress, String> {
    Optional<WatchProgress> findByUserIdAndMovieId(String userId, String movieId);
    List<WatchProgress> findByUserIdOrderByLastWatchedAtDesc(String userId);
}