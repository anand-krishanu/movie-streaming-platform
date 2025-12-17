package com.anand.backend.entity;

import com.anand.backend.enums.UserRole;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a User in the system.
 * <p>
 * This document is stored in the "users" collection. It maps the Firebase User ID to
 * local application data, including roles, profile information, and lightweight lists
 * for user preferences (favorites, watch later).
 * </p>
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

    /**
     * List of Movie IDs marked as "Watch Later" by the user.
     * <p>
     * This is an embedded list for performance reasons. Detailed movie information
     * is fetched separately when needed.
     * </p>
     */
    @Builder.Default
    private List<String> watchLaterMovieIds = new ArrayList<>();

    /**
     * List of Movie IDs marked as "Favorite" by the user.
     */
    @Builder.Default
    private List<String> favoriteMovieIds = new ArrayList<>();

    // Note: WatchHistory is NOT here. It is in a separate collection.

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
