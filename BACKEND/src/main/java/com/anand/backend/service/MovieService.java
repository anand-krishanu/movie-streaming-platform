package com.anand.backend.service;

import com.anand.backend.entity.Movie;
import com.anand.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final VideoProcessingService videoProcessingService;

    @Value("${video.upload.dir}")
    private String uploadDir;

    @Value("${video.processed.dir:C:/processed_videos}") // ✅ default fallback
    private String processedDir;

    public Movie saveMovie(String title, String description, String length,
                           String imdbRating, String genre, MultipartFile file)
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
                .build();

        Movie saved = movieRepository.save(movie);

        // Use proper processed directory
        videoProcessingService.convertToHLS(destFile.getAbsolutePath(), processedDirectory.getAbsolutePath(), saved.getMovieId());

        return saved;
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie getMovieById(String id) {
        return movieRepository.findById(id).orElse(null);
    }

    public void deleteMovie(String id) {
        Movie movie = getMovieById(id);
        if (movie != null) {
            File file = new File(movie.getFilePath());
            if (file.exists()) file.delete();
            movieRepository.deleteById(id);
        }
    }
}
