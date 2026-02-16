package com.anand.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Configuration class for initializing the Firebase SDK.
 * <p>
 * This configuration sets up the {@link FirebaseApp} instance using the service account credentials
 * provided via environment variables. This instance is required for verifying
 * Firebase ID tokens and interacting with Firebase services.
 * </p>
 */
@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_TYPE:service_account}")
    private String type;

    @Value("${FIREBASE_PROJECT_ID}")
    private String projectId;

    @Value("${FIREBASE_PRIVATE_KEY_ID}")
    private String privateKeyId;

    @Value("${FIREBASE_PRIVATE_KEY}")
    private String privateKey;

    @Value("${FIREBASE_CLIENT_EMAIL}")
    private String clientEmail;

    @Value("${FIREBASE_CLIENT_ID}")
    private String clientId;

    @Value("${FIREBASE_AUTH_URI:https://accounts.google.com/o/oauth2/auth}")
    private String authUri;

    @Value("${FIREBASE_TOKEN_URI:https://oauth2.googleapis.com/token}")
    private String tokenUri;

    @Value("${FIREBASE_AUTH_PROVIDER_X509_CERT_URL:https://www.googleapis.com/oauth2/v1/certs}")
    private String authProviderCertUrl;

    @Value("${FIREBASE_CLIENT_X509_CERT_URL}")
    private String clientCertUrl;

    @Value("${FIREBASE_UNIVERSE_DOMAIN:googleapis.com}")
    private String universeDomain;

    /**
     * Initializes and provides the singleton {@link FirebaseApp} bean.
     * <p>
     * If a FirebaseApp instance already exists, it returns the existing one.
     * Otherwise, it initializes a new app using the Google Credentials from environment variables.
     * </p>
     *
     * @return The initialized FirebaseApp instance.
     * @throws IOException If the credentials cannot be processed.
     */
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            // Build JSON string from environment variables
            String serviceAccountJson = String.format(
                    """
                    {
                      "type": "%s",
                      "project_id": "%s",
                      "private_key_id": "%s",
                      "private_key": "%s",
                      "client_email": "%s",
                      "client_id": "%s",
                      "auth_uri": "%s",
                      "token_uri": "%s",
                      "auth_provider_x509_cert_url": "%s",
                      "client_x509_cert_url": "%s",
                      "universe_domain": "%s"
                    }
                    """,
                    type, projectId, privateKeyId, privateKey, clientEmail, clientId,
                    authUri, tokenUri, authProviderCertUrl, clientCertUrl, universeDomain
            );

            ByteArrayInputStream serviceAccount = new ByteArrayInputStream(
                    serviceAccountJson.getBytes(StandardCharsets.UTF_8)
            );

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.getInstance();
    }
}