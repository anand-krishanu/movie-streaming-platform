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
    private List<String> genres;
    private Double imdbRating;
    private Instant releaseDate;

    private VideoDetails videoDetails;

    private Statistics statistics;

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
        private boolean processingCompleted;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Statistics {
        private long views = 0;
        private long likes = 0;
    }
}
