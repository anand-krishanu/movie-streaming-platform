package com.anand.backend.controller;

import com.anand.backend.entity.Favorite;
import com.anand.backend.entity.Movie;
import com.anand.backend.entity.User;
import com.anand.backend.repository.MovieRepository;
import com.anand.backend.service.FavouriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/fav")
public class FavouriteController {
    @Autowired
    private FavouriteService favouriteService;

    @Autowired
    private MovieRepository movieRepository;

    @PostMapping("/favorites")
    public ResponseEntity<User> addToFavorites(
            @RequestParam String email,
            @RequestBody Favorite movie) {
        return ResponseEntity.ok(favouriteService.addToFavorites(email, movie));
    }

    @DeleteMapping("/favorites/{movieId}")
    public ResponseEntity<User> removeFromFavorites(
            @RequestParam String email,
            @PathVariable String movieId) {
        return ResponseEntity.ok(favouriteService.removeFromFavorites(email, movieId));
    }

    @GetMapping("/movies/top-favorites")
    public List<Movie> getTopFavorites() {
        return movieRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getFavoritesCount(), a.getFavoritesCount()))
                .limit(10)
                .toList();
    }

}
