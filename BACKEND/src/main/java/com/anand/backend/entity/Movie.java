package com.anand.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
@Document(collection = "movies")
public class Movie {

    @Id
    private String movieId;

    private String movieTitle;
    private String movieDescription;
    private String moviePoster; // URL to the movie poster image
    private List<String> genres;
    private Double imdbRating;
    private Instant releaseDate;

    private VideoDetails videoDetails;

    @Builder.Default
    private Statistics statistics = new Statistics();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VideoDetails {
        private String originalFileName;
        private Long sizeInBytes;
        private Integer durationSeconds;

        private String hlsMasterUrl;

        private String thumbnailSpriteUrl;
        private String previewGifUrl;
        private boolean processingCompleted;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Statistics {
        @Builder.Default
        private long views = 0;
        
        @Builder.Default
        private long likes = 0;
        
        @Builder.Default
        private List<String> likedByUserIds = new java.util.ArrayList<>();
        
        // Custom getter to ensure it exists
        public List<String> getLikedByUserIds() {
            if (likedByUserIds == null) {
                likedByUserIds = new java.util.ArrayList<>();
            }
            return likedByUserIds;
        }
    }
}
