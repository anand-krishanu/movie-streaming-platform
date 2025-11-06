package com.anand.backend.repository;

import com.anand.backend.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for performing CRUD operations on the {@link Movie} collection in MongoDB.
 * <p>
 * This interface extends {@link MongoRepository}, which provides a complete set of
 * ready-to-use methods such as:
 * <ul>
 *     <li>{@code save(Movie movie)} – Inserts or updates a movie record</li>
 *     <li>{@code findById(String id)} – Retrieves a movie by its unique ID</li>
 *     <li>{@code findAll()} – Fetches all movie documents</li>
 *     <li>{@code deleteById(String id)} – Removes a movie by ID</li>
 * </ul>
 *
 * <p>Additional custom queries can be defined using Spring Data’s derived query methods
 * (e.g. {@code findByGenre(String genre)}).</p>
 *
 * <p><b>Example:</b>
 * <pre>{@code
 * List<Movie> movies = movieRepository.findByGenre("Action");
 * }</pre>
 * </p>
 *
 * @see Movie
 * @see org.springframework.data.mongodb.repository.MongoRepository
 * @author Krishanu
 * @since 2025
 */
@Repository
public interface MovieRepository extends MongoRepository<Movie, String> {
    // Custom query methods can be defined here if needed
    Page<Movie> findAll(Pageable pageable);
    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    Page<Movie> findByTitleRegex(String title, Pageable pageable);

    @Query("{ $and: [ "
            + " { $or: [ { 'genre': ?0 }, { ?0: null } ] }, "
            + " { $or: [ { 'language': ?1 }, { ?1: null } ] }, "
            + " { $or: [ { 'releaseYear': ?2 }, { ?2: null } ] } "
            + " ] }")
    Page<Movie> filterMovies(String genre, String language, Integer releaseYear, Pageable pageable);
}
