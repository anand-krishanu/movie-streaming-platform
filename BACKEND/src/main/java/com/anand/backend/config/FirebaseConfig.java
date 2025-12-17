package com.anand.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

/**
 * Configuration class for initializing the Firebase SDK.
 * <p>
 * This configuration sets up the {@link FirebaseApp} instance using the service account credentials
 * provided in the `service-account.json` file. This instance is required for verifying
 * Firebase ID tokens and interacting with Firebase services.
 * </p>
 */
@Configuration
public class FirebaseConfig {
    /**
     * Initializes and provides the singleton {@link FirebaseApp} bean.
     * <p>
     * If a FirebaseApp instance already exists, it returns the existing one.
     * Otherwise, it initializes a new app using the Google Credentials from the classpath resource.
     * </p>
     *
     * @return The initialized FirebaseApp instance.
     * @throws IOException If the service-account.json file cannot be read.
     */
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            ClassPathResource resource = new ClassPathResource("service-account.json");
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                    .build();
            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.getInstance();
    }
}