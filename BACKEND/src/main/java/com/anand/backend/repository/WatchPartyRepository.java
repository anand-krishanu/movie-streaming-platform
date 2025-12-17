package com.anand.backend.repository;

import com.anand.backend.entity.WatchParty;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for managing {@link WatchParty} sessions.
 * <p>
 * Facilitates the creation, retrieval, and management of synchronized viewing sessions.
 * It supports operations to validate host sessions and manage active parties.
 */
@Repository
public interface WatchPartyRepository extends MongoRepository<WatchParty, String> {
    Optional<WatchParty> findByMovieIdAndHostUserId(String movieId, String hostUserId);
}
