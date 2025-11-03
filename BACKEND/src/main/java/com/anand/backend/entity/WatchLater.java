package com.anand.backend.entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "watch_later")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchLater {
    private String movieId;
    private String title;
    private String posterUrl;
    private Instant addedAt;
}
