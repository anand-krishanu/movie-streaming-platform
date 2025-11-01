package com.anand.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
@Document(collection = "movie")
public class Movie {
    @Id
    private String movieId;

    private String movieTitle;
    private String movieDescription;
    private String movieLength;
    private String IMDBRating;
    private String genre;

    private String filePath;
    private String thumbnail;
    private long size;
}
