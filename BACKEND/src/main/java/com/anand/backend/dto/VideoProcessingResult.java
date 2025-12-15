package com.anand.backend.dto;

public record VideoProcessingResult(
        String masterPlaylistFilename,
        String thumbnailFilename,
        String previewGifFilename,
        String timelineThumbnailsPattern,
        Integer durationSeconds
) {}