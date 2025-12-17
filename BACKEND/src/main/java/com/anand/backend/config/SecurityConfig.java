package com.anand.backend.config;

import com.anand.backend.security.FirebaseTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final FirebaseTokenFilter firebaseTokenFilter;

    /**
     * Configures the Security Filter Chain for the application.
     * <p>
     * This configuration defines:
     * <ul>
     *   <li>CORS (Cross-Origin Resource Sharing) policies to allow frontend access.</li>
     *   <li>CSRF (Cross-Site Request Forgery) protection settings (disabled for stateless APIs).</li>
     *   <li>Authorization rules for specific endpoints (public vs. protected).</li>
     *   <li>Integration of the Firebase Authentication filter for JWT verification.</li>
     * </ul>
     * </p>
     *
     * @param http The HttpSecurity object to configure.
     * @return The built SecurityFilterChain.
     * @throws Exception If an error occurs during configuration.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configure(http))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints: General public API, HLS streaming, and WebSocket connections
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/movies/stream/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        
                        // All other endpoints require a valid authentication token
                        .anyRequest().authenticated()
                )
                // Add the Firebase Authentication filter before the standard UsernamePasswordAuthenticationFilter
                // This ensures that the Firebase token is verified before Spring Security processes the request.
                .addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}