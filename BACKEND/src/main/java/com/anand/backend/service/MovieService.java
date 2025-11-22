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
    private String serverBaseUrl; // Good practice to put domain in properties

    // ----------------------------------------------------------------
    // 1. UPLOAD MOVIE
    // ----------------------------------------------------------------
    @Transactional
    public Movie uploadMovie(
            String title,
            String description,
            Double imdbRating,
            List<String> genres,
            String poster,
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
                .moviePoster(poster) // Add poster URL
                .genres(genres)
                .imdbRating(imdbRating) // Note: field name is camelCase in Entity
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

    // ----------------------------------------------------------------
    // 2. READ OPERATIONS (Get, Search, Filter)
    // ----------------------------------------------------------------

    public Movie getMovieById(String id) {
        return movieRepository.findById(id).orElse(null);
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Page<Movie> getAllMovies(int page, int size) {
        // Sort by newest first
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return movieRepository.findAll(pageable);
    }

    public Page<Movie> searchMovies(String title, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return movieRepository.findByMovieTitleContainingIgnoreCase(title, pageable);
    }

    public Page<Movie> filterMovies(String genre, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // If genre is null/empty, return all, otherwise filter
        if (genre == null || genre.isBlank()) {
            return movieRepository.findAll(pageable);
        }
        return movieRepository.findByGenresContaining(genre, pageable);
    }

    // ----------------------------------------------------------------
    // 3. DELETE MOVIE (Clean up Database + Files)
    // ----------------------------------------------------------------
    public void deleteMovie(String movieId) {
        Movie movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) return;

        // 1. Delete Raw Uploaded File (if exists)
        // We need to reconstruct the path. Ideally, store raw path in DB,
        // but here we check if we can find it in the uploadDir.
        // Note: In production, better to store 'rawFilePath' in VideoDetails.
        // For now, we rely on the fact that we don't easily know the exact unique name
        // unless we stored it. *I recommend adding `rawFilePath` to your Entity later.* // 2. Delete Processed Folder (HLS files)
        File processedFolder = new File(processedDir, movieId);
        if (processedFolder.exists()) {
            deleteRecursive(processedFolder);
        }

        // 3. Delete from DB
        movieRepository.deleteById(movieId);
        log.info("Deleted movie and files for ID: {}", movieId);
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
    // 4. CALLBACK HANDLERS
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

        // If you added GIF support in Entity/DTO:
        // details.setPreviewGifUrl(streamingBaseUrl + result.previewGifFilename());

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