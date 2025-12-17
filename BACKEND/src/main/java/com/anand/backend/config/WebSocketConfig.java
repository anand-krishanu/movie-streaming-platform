package com.anand.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration.
 * <p>
 * This configuration enables WebSocket capabilities using the STOMP (Simple Text Oriented Messaging Protocol)
 * over WebSocket. It sets up the message broker for real-time communication between the server and clients,
 * facilitating features such as live notifications and chat.
 * </p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures the message broker options.
     * <p>
     * This method sets up:
     * <ul>
     *   <li>A simple in-memory message broker to carry messages back to the client on destinations prefixed with "/topic".</li>
     *   <li>An application destination prefix "/app" for messages bound for methods annotated with @MessageMapping.</li>
     * </ul>
     * </p>
     *
     * @param config The MessageBrokerRegistry to configure the broker.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers STOMP endpoints mapping each to a specific URL.
     * <p>
     * The endpoint "/ws" is the connection point for WebSocket clients.
     * SockJS is enabled to provide fallback options for browsers that do not support WebSockets natively.
     * </p>
     *
     * @param registry The StompEndpointRegistry to register endpoints.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for WebSocket connections
                .withSockJS();
    }
}
