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

    // --- LIGHTWEIGHT LISTS (Embedded) ---
    // We store only Movie IDs here. The frontend fetches details later.

    @Builder.Default
    private List<String> watchLaterMovieIds = new ArrayList<>();

    @Builder.Default
    private List<String> favoriteMovieIds = new ArrayList<>();

    // Note: WatchHistory is NOT here. It is in a separate collection.

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
