package com.anand.backend.service;

import com.anand.backend.dto.VideoProcessingResult;
import com.anand.backend.entity.Movie;
import com.anand.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service class for managing Movie entities and related operations.
 * <p>
 * This service handles the business logic for:
 * <ul>
 *   <li>Uploading and storing movie files</li>
 *   <li>Initiating asynchronous video processing pipelines</li>
 *   <li>Retrieving, searching, and filtering movies</li>
 *   <li>Managing movie statistics (views, likes)</li>
 *   <li>Cleaning up resources upon deletion</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final VideoProcessingService videoProcessingService;

    @Value("${video.upload.dir:uploads}")
    private String uploadDir;

    @Value("${video.processed.dir:processed}")
    private String processedDir;

    @Value("${server.base-url:http://localhost:8080}")
    private String serverBaseUrl;

    /**
     * Uploads a movie file and initiates the processing pipeline.
     * <p>
     * This method performs the following steps:
     * <ol>
     *   <li>Validates the input file.</li>
     *   <li>Saves the raw video file to the upload directory.</li>
     *   <li>Creates and saves the initial Movie entity with metadata.</li>
     *   <li>Triggers the asynchronous FFmpeg processing pipeline.</li>
     * </ol>
     * </p>
     *
     * @param title       The title of the movie.
     * @param description The description of the movie.
     * @param imdbRating  The IMDb rating.
     * @param genres      The list of genres.
     * @param poster      The URL of the poster image.
     * @param releaseYear The release year.
     * @param file        The raw video file.
     * @return The saved Movie entity (before processing is complete).
     * @throws IOException If an error occurs during file I/O.
     */
    @Transactional
    public Movie uploadMovie(
            String title,
            String description,
            Double imdbRating,
            List<String> genres,
            String poster,
            Integer releaseYear,
            MultipartFile file
    ) throws IOException {

        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");

        // Prepare Folders
        File uploadFolder = new File(uploadDir);
        File processedRoot = new File(processedDir);
        if (!uploadFolder.exists()) uploadFolder.mkdirs();
        if (!processedRoot.exists()) processedRoot.mkdirs();

        // Save Raw File
        String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File savedFile = new File(uploadFolder, uniqueName);
        file.transferTo(savedFile);

        // Initialize VideoDetails (Using Builder)
        Movie.VideoDetails videoDetails = Movie.VideoDetails.builder()
                .originalFileName(file.getOriginalFilename())
                .sizeInBytes(file.getSize())
                .processingCompleted(false)
                .build();

        // Build Movie Entity
        Movie movie = Movie.builder()
                .movieId(UUID.randomUUID().toString())
                .movieTitle(title)
                .movieDescription(description)
                .moviePoster(poster)
                .genres(genres)
                .imdbRating(imdbRating)
                .releaseYear(releaseYear)
                .videoDetails(videoDetails)
                .build();

        Movie savedMovie = movieRepository.save(movie);

        // Trigger Async Processing
        File outputDir = new File(processedRoot, savedMovie.getMovieId());

        CompletableFuture<VideoProcessingResult> future = videoProcessingService.processFullPipeline(
                savedMovie.getMovieId(),
                savedFile.getAbsolutePath(),
                outputDir.getAbsolutePath()
        );

        // Handle Callback
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                handleFailure(savedMovie.getMovieId());
            } else {
                handleSuccess(savedMovie.getMovieId(), result, outputDir.getName());
            }
        });

        return savedMovie;
    }

    /**
     * Retrieves a movie by its ID.
     *
     * @param id The movie ID.
     * @return The Movie entity, or null if not found.
     */
    public Movie getMovieById(String id) {
        return movieRepository.findById(id).orElse(null);
    }

    /**
     * Retrieves all movies.
     *
     * @return A list of all movies.
     */
    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    /**
     * Retrieves a paginated list of movies, sorted by creation date (newest first).
     *
     * @param page The page number.
     * @param size The page size.
     * @return A Page of Movie entities.
     */
    public Page<Movie> getAllMovies(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return movieRepository.findAll(pageable);
    }

    /**
     * Searches for movies by title (case-insensitive).
     *
     * @param title The title fragment to search for.
     * @param page  The page number.
     * @param size  The page size.
     * @return A Page of matching Movie entities.
     */
    public Page<Movie> searchMovies(String title, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return movieRepository.findByMovieTitleContainingIgnoreCase(title, pageable);
    }

    /**
     * Filters movies by genre.
     *
     * @param genre The genre to filter by.
     * @param page  The page number.
     * @param size  The page size.
     * @return A Page of matching Movie entities.
     */
    public Page<Movie> filterMovies(String genre, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // If genre is null/empty, return all, otherwise filter
        if (genre == null || genre.isBlank()) {
            return movieRepository.findAll(pageable);
        }
        return movieRepository.findByGenresContaining(genre, pageable);
    }

    /**
     * Deletes a movie and cleans up all associated files.
     * <p>
     * This method removes:
     * <ul>
     *   <li>The processed video files (HLS segments, playlists).</li>
     *   <li>The Movie entity from the database.</li>
     * </ul>
     * Note: Raw file deletion logic is currently limited as the exact path is not persisted.
     * </p>
     *
     * @param movieId The ID of the movie to delete.
     */
    public void deleteMovie(String movieId) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) return;

        // 1. Delete Processed Folder (HLS files)
        File processedFolder = new File(processedDir, movieId);
        if (processedFolder.exists()) {
            deleteRecursive(processedFolder);
        }

        // 2. Delete from DB
        movieRepository.deleteById(movieId);
        log.info("Deleted movie and files for ID: {}", movieId);
    }

    /**
     * Increments the view count for a movie.
     *
     * @param movieId The ID of the movie.
     */
    @Transactional
    public void incrementView(String movieId) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie != null) {
            if (movie.getStatistics() == null) {
                movie.setStatistics(Movie.Statistics.builder().views(1).likes(0).build());
            } else {
                movie.getStatistics().setViews(movie.getStatistics().getViews() + 1);
            }
            movieRepository.save(movie);
            log.info("View count incremented for movie: {}", movieId);
        }
    }

    /**
     * Toggles the like count for a movie.
     * <p>
     * Note: This is a simplified implementation that just increments the count.
     * A production implementation should track likes per user to allow toggling off.
     * </p>
     *
     * @param movieId The ID of the movie.
     */
    @Transactional
    public void toggleLike(String movieId) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie != null) {
            if (movie.getStatistics() == null) {
                movie.setStatistics(Movie.Statistics.builder().views(0).likes(1).build());
            } else {
                long currentLikes = movie.getStatistics().getLikes();
                movie.getStatistics().setLikes(currentLikes + 1);
            }
            movieRepository.save(movie);
            log.info("Like toggled for movie: {}", movieId);
        }
    }

    // Helper to delete folder with contents
    private void deleteRecursive(File file) {
        if (file.isDirectory()) {
            for (File f : file.listFiles()) {
                deleteRecursive(f);
            }
        }
        file.delete();
    }

    // ----------------------------------------------------------------
    // 6. CALLBACK HANDLERS
    // ----------------------------------------------------------------

    private void handleSuccess(String movieId, VideoProcessingResult result, String folderName) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) return;

        // IMPORTANT: Build the URL to match your Controller's @GetMapping path
        // Logic: http://localhost:8080/api/movies/stream/{movieId}/master.m3u8
        String streamingBaseUrl = serverBaseUrl + "/api/movies/stream/" + movieId + "/";

        Movie.VideoDetails details = movie.getVideoDetails();
        details.setProcessingCompleted(true);
        details.setHlsMasterUrl(streamingBaseUrl + result.masterPlaylistFilename());
        details.setThumbnailSpriteUrl(streamingBaseUrl + result.thumbnailFilename());
        details.setPreviewGifUrl(streamingBaseUrl + result.previewGifFilename());
        details.setDurationSeconds(result.durationSeconds());

        movieRepository.save(movie);
        log.info("Movie {} processing COMPLETED. URLs updated.", movieId);
    }

    private void handleFailure(String movieId) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie != null) {
            log.error("Processing FAILED for movie {}", movieId);
            // Ideally set a status flag here if your entity supports it
        }
    }
}