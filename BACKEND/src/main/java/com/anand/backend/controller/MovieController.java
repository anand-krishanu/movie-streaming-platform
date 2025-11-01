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

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    // ✅ load from application.properties
    @Value("${video.processed.dir}")
    private String processedDir;

    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }

    // ✅ Upload movie
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

    // ✅ Get all movies
    @GetMapping
    public List<Movie> getMovies() {
        return movieService.getAllMovies();
    }

    // ✅ Get single movie
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        Movie movie = movieService.getMovieById(id);
        return movie != null ? ResponseEntity.ok(movie) : ResponseEntity.notFound().build();
    }

    // ✅ Delete movie
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Stream HLS files (index.m3u8 and .ts)
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