package com.anand.backend.repository;

import com.anand.backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for managing {@link User} documents.
 * <p>
 * Handles data access for user profiles, authentication mapping, and
 * user-specific metadata. This repository is critical for the authentication
 * flow and user session management.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}