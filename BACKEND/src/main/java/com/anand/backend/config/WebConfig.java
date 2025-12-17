package com.anand.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global Web Configuration.
 * <p>
 * This class defines the global Cross-Origin Resource Sharing (CORS) configuration for the application.
 * It ensures that the frontend application can securely communicate with the backend API by specifying
 * allowed origins, HTTP methods, and headers.
 * </p>
 */
@Configuration
public class WebConfig {

    /**
     * Creates a WebMvcConfigurer bean to customize CORS settings.
     *
     * @return A WebMvcConfigurer instance with the defined CORS mappings.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            /**
             * Configures CORS mappings for the application.
             * <p>
             * This configuration allows requests from any origin ("*") for development flexibility.
             * <b>Note:</b> In a production environment, "allowedOrigins" should be restricted to the
             * specific domain of the frontend application to enhance security.
             * </p>
             *
             * @param registry The CorsRegistry to add mappings to.
             */
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*") // Allow all origins (Development only)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}