package com.anand.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

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
    private String picture; // profile image from Google
    private String role = "USER"; // USER or ADMIN
    private Date joinedAt = new Date();
}

