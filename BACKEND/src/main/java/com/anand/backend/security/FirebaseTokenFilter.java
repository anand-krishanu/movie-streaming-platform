package com.anand.backend.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                // 1. Verify Token with Firebase
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);

                // 2. If valid, tell Spring "User is Logged In"
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        decodedToken, null, new ArrayList<>());

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                System.out.println("Token verification failed: " + e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}