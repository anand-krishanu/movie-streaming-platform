package com.anand.backend.service;

import org.springframework.stereotype.Service;
import java.io.*;

/**
 * Service responsible for processing and converting uploaded video files
 * into HTTP Live Streaming (HLS) format using FFmpeg.
 * <p>
 * This service:
 * <ul>
 *   <li>Executes FFmpeg commands to generate .m3u8 playlists and .ts segments.</li>
 *   <li>Creates dedicated folders for each movie using its unique ID.</li>
 *   <li>Streams FFmpeg console output to the application logs for debugging.</li>
 * </ul>
 *
 * <p>HLS (HTTP Live Streaming) allows adaptive bitrate streaming and is compatible
 * with major players (e.g., VLC, HTML5 video players, iOS, Android).</p>
 *
 * <p><b>Example Output:</b><br>
 * <code>
 * /processed_videos/{movieId}/index.m3u8<br>
 * /processed_videos/{movieId}/segment0.ts<br>
 * /processed_videos/{movieId}/segment1.ts ...
 * </code>
 * </p>
 *
 * @author Krishanu
 * @since 2025
 */
@Service
public class VideoProcessingService {

    /**
     * Converts a given input video into HLS (.m3u8 + .ts) format using FFmpeg.
     *
     * @param inputPath  Full path to the source video file (e.g., uploaded .mp4).
     * @param outputDir  Directory where the processed HLS output will be stored.
     * @param movieId    Unique movie identifier used for output folder naming.
     */
    public void convertToHLS(String inputPath, String outputDir, String movieId) {
        try {
            File inputFile = new File(inputPath);
            File outputFolder = new File(outputDir, movieId);

            if (!outputFolder.exists()) outputFolder.mkdirs();

            // FFmpeg command
            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-i", inputFile.getAbsolutePath(),
                    "-profile:v", "baseline",
                    "-level", "3.0",
                    "-start_number", "0",
                    "-hls_time", "10",
                    "-hls_list_size", "0",
                    "-f", "hls",
                    new File(outputFolder, "index.m3u8").getAbsolutePath()
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("[FFmpeg] " + line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("FFmpeg conversion complete for movieId: " + movieId);
            } else {
                System.err.println("FFmpeg failed with exit code " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}