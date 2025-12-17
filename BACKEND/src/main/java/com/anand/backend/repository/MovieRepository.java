package com.anand.backend.repository;

import com.anand.backend.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;


/**
 * Repository interface for managing {@link Movie} documents in MongoDB.
 * <p>
 * Provides standard CRUD operations and custom queries for content discovery,
 * including full-text search simulation via regex and complex filtering pipelines.
 * This repository serves as the primary data access layer for the content catalog.
 */
@Repository
public interface MovieRepository extends MongoRepository<Movie, String> {
    Page<Movie> findByMovieTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<Movie> findByGenresContaining(String genre, Pageable pageable);


    @Query("{ 'videoDetails.processingCompleted': true }")
    Page<Movie> findByProcessingCompleted(Pageable pageable);

    
    @Query("{ " +
            "  $and: [ " +
            "    { 'movieTitle': { $regex: ?0, $options: 'i' } }, " +
            "    { $or: [ { ?1: null }, { 'genres': ?1 } ] } " +
            "  ] " +
            "}")
    Page<Movie> searchAndFilter(String titleKeyword, String genre, Pageable pageable);
}