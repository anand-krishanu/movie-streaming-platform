package com.anand.backend.repository;

import com.anand.backend.entity.WatchParty;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WatchPartyRepository extends MongoRepository<WatchParty, String> {
    
    Optional<WatchParty> findByMovieIdAndHostUserId(String movieId, String hostUserId);
    
}
