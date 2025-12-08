package com.anand.backend.service;

import com.anand.backend.dto.VideoProcessingResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class VideoProcessingService {

    // Use CompletableFuture to return result to the caller (MovieService)
    @Async
    public CompletableFuture<VideoProcessingResult> processFullPipeline(
            String movieId,
            String inputFilePath,
            String outputDirBase
    ) {
        log.info("🎬 Starting FFmpeg pipeline for Movie ID: {}", movieId);

        File inputFile = new File(inputFilePath);
        File outputDir = new File(outputDirBase);

        if (!outputDir.exists()) outputDir.mkdirs();

        try {
            // 1. Generate HLS Master Playlist (Multi-bitrate)
            String masterPlaylist = convertToMultiBitrateHLS(inputFile, outputDir);

            // 2. Generate Static Thumbnail (Taken at 5th second)
            String thumbnailPath = generateThumbnail(inputFile, outputDir);

            // 3. Generate 5-Second Preview GIF (For hover effect)
            String previewGifPath = generatePreviewGif(inputFile, outputDir);

            // 4. Generate Timeline Thumbnails (Every 10s)
            String timelineThumbnailsPattern = generateTimelineThumbnails(inputFile, outputDir);

            log.info("✅ Pipeline Finished for Movie ID: {}", movieId);

            // Return the relative paths (Assuming you serve static files from outputDir)
            // In production, you would upload these files to S3 here and return S3 URLs.
            return CompletableFuture.completedFuture(new VideoProcessingResult(
                    masterPlaylist,
                    thumbnailPath,
                    previewGifPath,
                    timelineThumbnailsPattern
            ));

        } catch (Exception e) {
            log.error("❌ FFmpeg pipeline failed for {}", movieId, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    // --- TASK 1: HLS CONVERSION ---
    private String convertToMultiBitrateHLS(File input, File outputDir) throws IOException, InterruptedException {
        String segmentFilename = outputDir.getAbsolutePath() + "/segment_%v_%03d.ts";
        String masterPlaylist = outputDir.getAbsolutePath() + "/master.m3u8";

        // Ensure sub-directories exist if needed, but here we flatten for simplicity
        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y", "-i", input.getAbsolutePath(),
                "-filter_complex",
                "[0:v]split=3[v1][v2][v3];" +
                        "[v1]scale=w=1920:h=1080[v1out];" +
                        "[v2]scale=w=1280:h=720[v2out];" +
                        "[v3]scale=w=854:h=480[v3out]",

                // 1080p Stream
                "-map", "[v1out]", "-c:v:0", "libx264", "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k",
                "-map", "a:0", "-c:a:0", "aac", "-b:a:0", "192k",

                // 720p Stream
                "-map", "[v2out]", "-c:v:1", "libx264", "-b:v:1", "2800k", "-maxrate:v:1", "2996k", "-bufsize:v:1", "4200k",
                "-map", "a:0", "-c:a:1", "aac", "-b:a:1", "128k",

                // 480p Stream
                "-map", "[v3out]", "-c:v:2", "libx264", "-b:v:2", "1400k", "-maxrate:v:2", "1498k", "-bufsize:v:2", "2100k",
                "-map", "a:0", "-c:a:2", "aac", "-b:a:2", "128k",

                "-f", "hls",
                "-hls_time", "10",
                "-hls_playlist_type", "vod",
                "-hls_flags", "independent_segments",
                "-hls_segment_filename", segmentFilename,
                "-master_pl_name", "master.m3u8",
                "-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2",
                outputDir.getAbsolutePath() + "/stream_%v.m3u8"
        );

        runProcess(pb);
        return "master.m3u8"; // Return filename only (relative)
    }

    // --- TASK 2: THUMBNAIL ---
    private String generateThumbnail(File input, File outputDir) throws IOException, InterruptedException {
        String filename = "thumbnail.jpg";
        File target = new File(outputDir, filename);

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y",
                "-ss", "00:01:00",
                "-i", input.getAbsolutePath(),
                "-vframes", "1", // Take 1 frame
                "-q:v", "2", // High quality jpg
                target.getAbsolutePath()
        );

        runProcess(pb);
        return filename;
    }

    // --- TASK 3: 5-SEC PREVIEW (GIF/WebP) ---
    private String generatePreviewGif(File input, File outputDir) throws IOException, InterruptedException {
        String filename = "preview.gif"; // WebP is better, but GIF is universally supported
        File target = new File(outputDir, filename);

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y",
                "-ss", "00:01:00", // Start at 10s
                "-t", "5",         // Duration 5s
                "-i", input.getAbsolutePath(),
                "-vf", "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                "-loop", "0",
                target.getAbsolutePath()
        );

        runProcess(pb);
        return filename;
    }

    // --- TASK 4: TIMELINE THUMBNAILS ---
    private String generateTimelineThumbnails(File input, File outputDir) throws IOException, InterruptedException {
        // Pattern for filenames: thumb_0001.jpg, thumb_0002.jpg, etc.
        String filenamePattern = "thumb_%04d.jpg";
        String outputPath = outputDir.getAbsolutePath() + File.separator + filenamePattern;

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y",
                "-i", input.getAbsolutePath(),
                "-vf", "fps=1/10,scale=160:90", // 1 frame every 10 seconds, resized to 160x90
                "-q:v", "2",
                outputPath
        );

        runProcess(pb);
        return filenamePattern;
    }

    private void runProcess(ProcessBuilder pb) throws IOException, InterruptedException {
        pb.redirectErrorStream(true);
        Process process = pb.start();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug(line); // Don't flood Info logs with FFmpeg output
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("FFmpeg process failed with exit code " + exitCode);
        }
    }
}