package com.anand.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "watch_progress")
// This Index makes finding "User X's progress on Movie Y" instant
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