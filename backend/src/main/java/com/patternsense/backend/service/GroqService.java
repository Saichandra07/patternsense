package com.patternsense.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);
    private final ObjectMapper objectMapper;

    private static final String GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";

    public String analyzeProblem(String title, String description, String apiKey) throws Exception {
        String prompt = """
                You are building a Socratic DSA tutoring engine. Analyze this problem and return a JSON object.

                Problem: %s

                Description: %s

                Return exactly this JSON structure (no extra fields):
                {
                  "core_pattern": "the primary algorithm pattern that solves this (e.g. Two Pointers, Sliding Window)",
                  "common_misconceptions": ["what beginners typically misunderstand", "another common wrong assumption"],
                  "key_insight": "the single most important insight that unlocks this problem",
                  "closest_wrong_pattern": "the pattern that looks most similar but will not solve this",
                  "variant_traps": ["a common sub-variant or edge case that trips people up"],
                  "socratic_angles": ["a question to guide a stuck user toward the key insight", "another guiding question"],
                  "signal_keywords": ["3-6 specific words or short phrases from the problem description that signal this pattern — the exact words a solver should learn to notice"]
                }
                """.formatted(title, description);

        return callGroq(prompt, apiKey);
    }

    public String sendMessage(String prompt, String apiKey) throws Exception {
        return callGroq(prompt, apiKey);
    }

    private String callGroq(String prompt, String apiKey) throws Exception {
        String bodyJson = objectMapper.writeValueAsString(Map.of(
            "model", GROQ_MODEL,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "response_format", Map.of("type", "json_object")
        ));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_BASE))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        int[] backoffSeconds = {1, 2, 4};
        HttpResponse<String> response = null;

        for (int attempt = 0; attempt <= backoffSeconds.length; attempt++) {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) break;

            boolean retryable = response.statusCode() == 503 || response.statusCode() == 429;
            if (!retryable || attempt == backoffSeconds.length) {
                log.error("Groq error — status: {} body: {}", response.statusCode(), response.body());
                if (response.statusCode() == 429) {
                    throw new RuntimeException("quota exceeded: Your Groq API rate limit is exhausted. Wait a minute and try again, or switch to Gemini.");
                }
                throw new RuntimeException("Groq API error: HTTP " + response.statusCode());
            }

            log.warn("Groq returned {} — retrying in {}s (attempt {}/{})",
                response.statusCode(), backoffSeconds[attempt], attempt + 1, backoffSeconds.length);
            Thread.sleep(backoffSeconds[attempt] * 1000L);
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.at("/choices/0/message/content").asText();
    }
}
