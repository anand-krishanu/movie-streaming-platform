package com.anand.backend.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.util.UUID;

@Service
public class VideoProcessingService {

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

            pb.redirectErrorStream(true); // merge stderr and stdout
            Process process = pb.start();

            // ✅ Live FFmpeg output in console
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