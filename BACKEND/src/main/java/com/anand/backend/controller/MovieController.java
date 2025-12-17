package com.anand.backend.controller;

import com.anand.backend.entity.Movie;
import com.anand.backend.service.MovieService;
import com.anand.backend.service.MLRecommendationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

/**
 * REST Controller for managing movie resources.
 * <p>
 * This controller provides endpoints for:
 * <ul>
 *   <li>Uploading new movies with metadata</li>
 *   <li>Retrieving movie details and lists (paginated)</li>
 *   <li>Streaming video content via HLS (HTTP Live Streaming)</li>
 *   <li>Managing user interactions (likes, views)</li>
 *   <li>Deleting movies (Admin only)</li>
 * </ul>
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @Autowired
    private com.anand.backend.service.UserService userService;

    @Autowired
    private MLRecommendationService mlRecommendationService;

    @Value("${video.processed.dir:processed}")
    private String processedDir;

    /**
     * Simple health check endpoint.
     * @return A greeting message.
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello Worldies";
    }

    /**
     * Uploads a new movie to the platform.
     * <p>
     * This endpoint accepts multipart form data containing the movie file and its metadata.
     * Only users with the ADMIN role are authorized to perform this operation.
     * </p>
     *
     * @param title       The title of the movie.
     * @param description A brief description or synopsis.
     * @param imdbRating  The IMDb rating of the movie.
     * @param genres      A list of genres associated with the movie.
     * @param poster      The URL of the movie poster image.
     * @param releaseYear The year the movie was released.
     * @param file        The video file to be uploaded.
     * @param principal   The authenticated user principal (Firebase Token).
     * @return ResponseEntity containing the saved Movie entity or an error status.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadMovie(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("imdbRating") Double imdbRating,
            @RequestParam("genres") List<String> genres,
            @RequestParam(value = "poster", required = false) String poster,
            @RequestParam(value = "releaseYear", required = false) Integer releaseYear,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Object principal
    ) {
        com.google.firebase.auth.FirebaseToken token = (com.google.firebase.auth.FirebaseToken) principal;
        com.anand.backend.entity.User user = userService.getUserByEmail(token.getEmail()).orElse(null);

        if (user == null || user.getRole() != com.anand.backend.enums.UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            // Delegate to service for storage and processing
            Movie saved = movieService.uploadMovie(
                    title,
                    description,
                    imdbRating,
                    genres,
                    poster,
                    releaseYear,
                    file
            );
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Error uploading movie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves a paginated list of all movies.
     *
     * @param page The page number (zero-based).
     * @param size The number of items per page.
     * @return A Page object containing the list of movies.
     */
    @GetMapping
    public Page<Movie> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return movieService.getAllMovies(page, size);
    }

    /**
     * Retrieves a specific movie by its ID.
     *
     * @param id The unique identifier of the movie.
     * @return ResponseEntity containing the Movie entity if found, or 404 Not Found.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        Movie movie = movieService.getMovieById(id);
        return movie != null ? ResponseEntity.ok(movie) : ResponseEntity.notFound().build();
    }

    /**
     * Deletes a movie and its associated resources.
     * <p>
     * Only users with the ADMIN role are authorized to perform this operation.
     * </p>
     *
     * @param id        The unique identifier of the movie to delete.
     * @param principal The authenticated user principal.
     * @return ResponseEntity with 204 No Content on success, or error status.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id, @AuthenticationPrincipal Object principal) {
        com.google.firebase.auth.FirebaseToken token = (com.google.firebase.auth.FirebaseToken) principal;
        com.anand.backend.entity.User user = userService.getUserByEmail(token.getEmail()).orElse(null);

        if (user == null || user.getRole() != com.anand.backend.enums.UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Increments the view count for a specific movie.
     *
     * @param id The unique identifier of the movie.
     * @return ResponseEntity with a success message.
     */
    @PostMapping("/{id}/view")
    public ResponseEntity<String> incrementView(@PathVariable String id) {
        movieService.incrementView(id);
        return ResponseEntity.ok("View count incremented");
    }

    /**
     * Toggles the like status for a specific movie.
     *
     * @param id The unique identifier of the movie.
     * @return ResponseEntity with a success message.
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<String> toggleLike(@PathVariable String id) {
        movieService.toggleLike(id);
        return ResponseEntity.ok("Like toggled");
    }

    /**
     * Serves HLS (HTTP Live Streaming) content.
     * <p>
     * This endpoint handles requests for the master playlist (.m3u8), media segments (.ts),
     * and associated assets (thumbnails, previews). It maps the requested URL path to the
     * local file system where processed video files are stored.
     * </p>
     *
     * @param movieId The ID of the movie being streamed.
     * @param request The HttpServletRequest to extract the relative path.
     * @return ResponseEntity containing the requested resource or 404 Not Found.
     */
    @GetMapping("/stream/{movieId}/**")
    public ResponseEntity<Resource> streamHLS(
            @PathVariable String movieId,
            HttpServletRequest request
    ) {
        try {
            // Logic: /api/movies/stream/{movieId}/master.m3u8 -> maps to -> processedDir/{movieId}/master.m3u8
            String fullPath = request.getRequestURI();
            String prefix = "/api/movies/stream/" + movieId + "/";
            int index = fullPath.indexOf(prefix);

            if (index < 0) {
                return ResponseEntity.badRequest().build();
            }

            // Extract the part after the ID (e.g., "master.m3u8" or "segment_001.ts")
            String relativePath = fullPath.substring(index + prefix.length());

            // Security: Prevent Path Traversal (e.g. ../../windows/system32)
            if (relativePath.contains("..")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            File file = new File(processedDir + "/" + movieId + "/" + relativePath);

            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            FileSystemResource resource = new FileSystemResource(file);
            HttpHeaders headers = new HttpHeaders();

            // Set correct Content-Type based on file extension
            if (relativePath.endsWith(".m3u8")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl");
            } else if (relativePath.endsWith(".ts")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "video/MP2T");
            } else if (relativePath.endsWith(".vtt")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "text/vtt");
            } else if (relativePath.endsWith(".jpg") || relativePath.endsWith(".jpeg")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "image/jpeg");
            } else if (relativePath.endsWith(".gif")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "image/gif");
            } else {
                headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
            }

            // Add CORS headers specifically for HLS to allow the player to read content length
            headers.add("Access-Control-Expose-Headers", "Content-Length");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error streaming file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --------------------------------------------------------
    // SEARCH & FILTER
    // --------------------------------------------------------

    // Search by Title
    @GetMapping("/search")
    public Page<Movie> searchMovies(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return movieService.searchMovies(title, page, size);
    }

    // Filter by Genre (String matching)
    @GetMapping("/filter")
    public Page<Movie> filterMovies(
            @RequestParam(required = false) String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Note: We removed 'language' from the Service args in previous steps
        // If you need language, you must add it back to Repository and Service
        return movieService.filterMovies(genre, page, size);
    }

    // --------------------------------------------------------
    // ML RECOMMENDATIONS
    // --------------------------------------------------------

    @GetMapping("/recommendations")
    public ResponseEntity<List<Movie>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal Object principal
    ) {
        try {
            String userId = getCurrentUserId(principal);
            List<Movie> recommendations = mlRecommendationService.getRecommendationsForUser(userId, limit);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            log.error("Failed to get recommendations: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{movieId}/similar")
    public ResponseEntity<List<Movie>> getSimilarMovies(
            @PathVariable String movieId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        try {
            List<Movie> similar = mlRecommendationService.getSimilarMovies(movieId, limit);
            return ResponseEntity.ok(similar);
        } catch (Exception e) {
            log.error("Failed to get similar movies: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/ml/train")
    public ResponseEntity<String> trainMLModel() {
        try {
            String result = mlRecommendationService.trainModel();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to train model: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("ML service unavailable");
        }
    }

    // Helper method to get current user ID
    private String getCurrentUserId(Object principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        if (principal instanceof com.google.firebase.auth.FirebaseToken) {
            com.google.firebase.auth.FirebaseToken token = (com.google.firebase.auth.FirebaseToken) principal;
            return token.getUid();
        }
        
        throw new RuntimeException("Invalid authentication principal");
    }
}