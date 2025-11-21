package com.anand.backend.repository;

import com.anand.backend.entity.WatchProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface WatchProgressRepository extends MongoRepository<WatchProgress, String> {

    // Find specific progress to resume video
    Optional<WatchProgress> findByUserIdAndMovieId(String userId, String movieId);

    // Get all history for a user (Most recently watched first)
    List<WatchProgress> findByUserIdOrderByLastWatchedAtDesc(String userId);
}