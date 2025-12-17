package com.anand.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Entity tracking a user's playback progress for a specific movie.
 * <p>
 * This document is used to implement "Continue Watching" functionality.
 * It stores the last watched timestamp and completion status.
 * A compound index on (userId, movieId) ensures efficient lookups and uniqueness.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "watch_progress")
@CompoundIndex(name = "user_movie_idx", def = "{'userId': 1, 'movieId': 1}", unique = true)
public class WatchProgress {

    @Id
    private String id;

    private String userId;   // Links to User.id
    private String movieId;  // Links to Movie.movieId

    private Double timestampSeconds;      // e.g., 1540.5 seconds
    private Double totalDurationSeconds;  // e.g., 7200 seconds

    private boolean completed;            // True if watched > 90%

    private Instant lastWatchedAt;        // For sorting "Continue Watching"
}