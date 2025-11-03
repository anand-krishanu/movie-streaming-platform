package com.anand.backend.service;

import com.anand.backend.entity.Movie;
import com.anand.backend.enums.Genre;
import com.anand.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Service layer responsible for handling all business logic
 * related to movie upload, metadata management, and retrieval.
 * <p>
 * This service:
 * <ul>
 *   <li>Stores uploaded movie files to the configured directory.</li>
 *   <li>Persists movie metadata (title, genre, etc.) to MongoDB.</li>
 *   <li>Triggers FFmpeg conversion to HLS format for streaming.</li>
 *   <li>Supports retrieval and deletion of movie data.</li>
 * </ul>
 *
 * @author Krishanu
 * @since 2025
 */
@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final VideoProcessingService videoProcessingService;

    /** Repository for performing CRUD operations on Movie collection. */
    @Value("${video.upload.dir}")
    private String uploadDir;

    /** Directory for storing processed HLS output files. */
    @Value("${video.processed.dir:C:/processed_videos}")
    private String processedDir;

    /**
     * Saves a movie file to disk, processes it into HLS format,
     * and persists its metadata in MongoDB.
     *
     * @param title        Movie title.
     * @param description  Short description or synopsis.
     * @param length       Movie duration or length.
     * @param imdbRating   IMDb rating value.
     * @param genre        Movie genre (e.g., Action, Drama).
     * @param file         Uploaded video file.
     * @return The saved {@link Movie} entity with database ID and metadata.
     * @throws IOException              If file writing or transfer fails.
     * @throws InterruptedException     If FFmpeg process is interrupted.
     */
    @Transactional
    public Movie saveMovie(String title, String description, String length,
                           String imdbRating, Genre genre, MultipartFile file)
            throws IOException, InterruptedException {

        // ✅ Ensure upload directory exists
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }

        // ✅ Ensure processed directory exists
        File processedDirectory = new File(processedDir);
        if (!processedDirectory.exists()) {
            processedDirectory.mkdirs();
        }

        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID() + "_" +
                (originalFileName != null ? originalFileName : "video.mp4");

        File destFile = new File(uploadDirectory, uniqueFileName);
        file.transferTo(destFile);

        Movie movie = Movie.builder()
                .movieTitle(title)
                .movieDescription(description)
                .movieLength(length)
                .IMDBRating(imdbRating)
                .genre(genre)
                .filePath(destFile.getAbsolutePath())
                .size(file.getSize())
                .uploadedAt(Instant.now())
                .build();

        if (file.isEmpty() || title == null || title.isBlank()) {
            throw new IllegalArgumentException("Movie title and file are required");
        }

        Movie saved = movieRepository.save(movie);

        // Use proper processed directory
        videoProcessingService.convertToHLS(destFile.getAbsolutePath(), processedDirectory.getAbsolutePath(), saved.getMovieId());

        return saved;
    }

    /**
     * Retrieves a list of all stored movies from the database.
     *
     * @return List of all {@link Movie} entities.
     */
    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    /**
     * Retrieves a specific movie by its unique ID.
     *
     * @param id Movie's unique database ID.
     * @return Movie object if found, otherwise {@code null}.
     */
    public Movie getMovieById(String id) {
        return movieRepository.findById(id).orElse(null);
    }

    /**
     * Deletes a movie record and its associated file from disk.
     *
     * @param id ID of the movie to be deleted.
     */
    public void deleteMovie(String id) {
        Movie movie = getMovieById(id);
        if (movie != null) {
            File file = new File(movie.getFilePath());
            if (file.exists()) file.delete();
            movieRepository.deleteById(id);
        }
    }
}