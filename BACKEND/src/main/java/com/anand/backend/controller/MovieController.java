package com.anand.backend.controller;

import com.anand.backend.entity.Movie;
import com.anand.backend.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

/**
 * REST Controller that handles all HTTP requests related to movies.
 * <p>
 * Provides endpoints for:
 * <ul>
 *     <li>Uploading movie files with metadata</li>
 *     <li>Retrieving movies and details</li>
 *     <li>Deleting movies</li>
 *     <li>Streaming HLS-encoded video content</li>
 * </ul>
 *
 * <p>This controller works in conjunction with {@link MovieService} and
 * {@link com.anand.backend.service.VideoProcessingService} to manage
 * video lifecycle operations and provide video streaming capabilities.</p>
 *
 * <p>Base URL: <b>/api/movies</b></p>
 *
 * @author Krishanu
 * @since 2025
 */
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    /**
     * Directory where processed (HLS) videos are stored.
     * Configured in {@code application.properties} as {@code video.processed.dir}.
     */
    @Value("${video.processed.dir}")
    private String processedDir;

    /**
     * Basic test endpoint to verify the API is running.
     *
     * @return A simple "Hello World" response.
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }

    /**
     * Handles video upload requests and triggers the FFmpeg conversion process.
     * <p>
     * Accepts a multipart request containing both metadata and the raw video file.
     * Once uploaded, the file is processed and stored, and metadata is persisted in MongoDB.
     * </p>
     *
     * @param title        Movie title
     * @param description  Short description or synopsis
     * @param length       Duration (e.g., "2h 30m")
     * @param imdbRating   IMDB rating (e.g., "8.9")
     * @param genre        Movie genre (e.g., "Drama", "Action")
     * @param file         Video file (MP4 or any FFmpeg-compatible format)
     * @return ResponseEntity containing the saved {@link Movie} object
     */
    @PostMapping("/upload")
    public ResponseEntity<Movie> uploadMovie(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("length") String length,
            @RequestParam("imdb") String imdbRating,
            @RequestParam("genre") String genre,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            Movie saved = movieService.saveMovie(title, description, length, imdbRating, genre, file);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves a list of all movies stored in the database.
     *
     * @return List of all {@link Movie} objects
     */
    @GetMapping
    public List<Movie> getMovies() {
        return movieService.getAllMovies();
    }

    /**
     * Retrieves details for a specific movie by its unique ID.
     *
     * @param id Movie's MongoDB ID
     * @return {@link Movie} object if found, otherwise 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        Movie movie = movieService.getMovieById(id);
        return movie != null ? ResponseEntity.ok(movie) : ResponseEntity.notFound().build();
    }

    /**
     * Deletes a movie entry and removes the corresponding video file.
     *
     * @param id Movie ID to delete
     * @return HTTP 204 (No Content) on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Streams HLS video files (.m3u8 playlists and .ts segments) to clients.
     * <p>
     * This endpoint serves the processed video segments, allowing
     * video players (like VLC, React video.js, etc.) to stream
     * adaptive content seamlessly over HTTP.
     * </p>
     *
     * @param movieId  Movie ID folder name in processed directory
     * @param fileName File name within that directory (index.m3u8 or segment.ts)
     * @return HTTP 200 with video resource stream if found; 404 otherwise
     */
    @GetMapping("/stream/{movieId}/{fileName:.+}")
    public ResponseEntity<Resource> streamHLS(
            @PathVariable String movieId,
            @PathVariable String fileName
    ) {
        File file = new File(processedDir + "/" + movieId + "/" + fileName);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        FileSystemResource resource = new FileSystemResource(file);

        HttpHeaders headers = new HttpHeaders();
        if (fileName.endsWith(".m3u8")) {
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl");
        } else if (fileName.endsWith(".ts")) {
            headers.add(HttpHeaders.CONTENT_TYPE, "video/MP2T");
        } else {
            headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }
}