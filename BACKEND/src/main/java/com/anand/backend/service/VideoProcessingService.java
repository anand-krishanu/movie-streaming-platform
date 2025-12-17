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

/**
 * Service responsible for handling video processing tasks using FFmpeg.
 * <p>
 * This service orchestrates the entire video processing pipeline, which includes:
 * <ul>
 *   <li>Transcoding raw video into multi-bitrate HLS (HTTP Live Streaming) format.</li>
 *   <li>Generating static thumbnails for video representation.</li>
 *   <li>Creating animated GIF previews for UI hover effects.</li>
 *   <li>Extracting timeline thumbnails for seeking previews.</li>
 *   <li>Calculating video duration.</li>
 * </ul>
 * All operations are executed asynchronously to prevent blocking the main application thread.
 * </p>
 */
@Slf4j
@Service
public class VideoProcessingService {

    /**
     * Executes the full video processing pipeline asynchronously.
     *
     * @param movieId       The unique identifier of the movie.
     * @param inputFilePath The absolute path to the raw input video file.
     * @param outputDirBase The directory where processed files will be stored.
     * @return A CompletableFuture containing the {@link VideoProcessingResult} upon success, or an exception on failure.
     */
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

            // 5. Get Duration
            Integer durationSeconds = getDuration(inputFile);

            log.info("✅ Pipeline Finished for Movie ID: {}", movieId);

            // Return the relative paths (Assuming you serve static files from outputDir)
            // In production, you would upload these files to S3 here and return S3 URLs.
            return CompletableFuture.completedFuture(new VideoProcessingResult(
                    masterPlaylist,
                    thumbnailPath,
                    previewGifPath,
                    timelineThumbnailsPattern,
                    durationSeconds
            ));

        } catch (Exception e) {
            log.error("❌ FFmpeg pipeline failed for {}", movieId, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Converts the input video to HLS format with multiple bitrates (1080p, 720p, 480p).
     *
     * @param input     The input video file.
     * @param outputDir The directory to save the HLS segments and playlists.
     * @return The filename of the master playlist.
     * @throws IOException          If an I/O error occurs.
     * @throws InterruptedException If the process is interrupted.
     */
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

                // Global options
                "-preset", "ultrafast", "-threads", "0",

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

    /**
     * Generates a static thumbnail image from the video.
     *
     * @param input     The input video file.
     * @param outputDir The directory to save the thumbnail.
     * @return The filename of the generated thumbnail.
     * @throws IOException          If an I/O error occurs.
     * @throws InterruptedException If the process is interrupted.
     */
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

    /**
     * Generates a short animated GIF preview from the video.
     *
     * @param input     The input video file.
     * @param outputDir The directory to save the GIF.
     * @return The filename of the generated GIF.
     * @throws IOException          If an I/O error occurs.
     * @throws InterruptedException If the process is interrupted.
     */
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

    /**
     * Generates a series of thumbnails for the video timeline (e.g., for seeking).
     *
     * @param input     The input video file.
     * @param outputDir The directory to save the thumbnails.
     * @return The filename pattern for the generated thumbnails.
     * @throws IOException          If an I/O error occurs.
     * @throws InterruptedException If the process is interrupted.
     */
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

    private Integer getDuration(File input) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    input.getAbsolutePath()
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line = reader.readLine();
            process.waitFor();
            
            if (line != null) {
                return (int) Math.round(Double.parseDouble(line));
            }
        } catch (Exception e) {
            log.error("Failed to get video duration", e);
        }
        return 0;
    }
}