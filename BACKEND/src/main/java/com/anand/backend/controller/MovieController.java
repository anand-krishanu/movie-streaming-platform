package com.anand.backend.controller;

import com.anand.backend.entity.Movie;
import com.anand.backend.service.MovieService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @Value("${video.processed.dir:processed}")
    private String processedDir;

    @GetMapping("/hello")
    public String hello() {
        return "Hello Worldies";
    }

    // --------------------------------------------------------
    // UPLOAD MOVIE
    // --------------------------------------------------------
    @PostMapping("/upload")
    public ResponseEntity<Movie> uploadMovie(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("imdbRating") Double imdbRating, // Changed to Double
            @RequestParam("genres") List<String> genres,   // Changed to List<String>
            @RequestParam(value = "poster", required = false) String poster, // Movie poster URL
            @RequestParam("file") MultipartFile file
    ) {
        try {
            // Note: 'length' and 'language' were removed to match the Service signature
            // We calculate length automatically via FFmpeg in a real app
            Movie saved = movieService.uploadMovie(
                    title,
                    description,
                    imdbRating,
                    genres,
                    poster,
                    file
            );
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Error uploading movie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --------------------------------------------------------
    // GET ALL MOVIES (PAGINATED)
    // --------------------------------------------------------
    @GetMapping
    public Page<Movie> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return movieService.getAllMovies(page, size);
    }

    // --------------------------------------------------------
    // GET MOVIE BY ID
    // --------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        Movie movie = movieService.getMovieById(id);
        return movie != null ? ResponseEntity.ok(movie) : ResponseEntity.notFound().build();
    }

    // --------------------------------------------------------
    // DELETE MOVIE
    // --------------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    // --------------------------------------------------------
    // HLS STREAMING ENDPOINT
    // Serves .m3u8, .ts segments, and images
    // --------------------------------------------------------
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
                // log.warn("File not found: {}", file.getAbsolutePath()); // Optional logging
                return ResponseEntity.notFound().build();
            }

            FileSystemResource resource = new FileSystemResource(file);
            HttpHeaders headers = new HttpHeaders();

            // Set correct Content-Type
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

            // CORS is already configured globally in WebConfig, no need to add headers here
            // Just add expose headers for HLS functionality
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
}