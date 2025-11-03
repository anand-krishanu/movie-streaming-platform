package com.anand.backend.entity;

import com.anand.backend.enums.UserRole;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Represents a User authenticated via Google OAuth2.
 */
@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;
    private String email;
    private String name;
    private String picture;

    @Builder.Default
    private UserRole role = UserRole.USER;


    @Builder.Default
    private List<WatchLater> watchLater = new ArrayList<>();

    @Builder.Default
    private List<WatchHistory> watchHistory = new ArrayList<>();

    @Builder.Default
    private List<Favorite> favorites = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

