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
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private final ObjectMapper objectMapper;

    private static final String GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    /**
     * Analyzes a problem once (called at session start). Returns a JSON string
     * matching the ProblemBrief schema used by all session prompts.
     */
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
                  "socratic_angles": ["a question to guide a stuck user toward the key insight", "another guiding question"]
                }
                """.formatted(title, description);

        return callGemini(prompt, apiKey);
    }

    /**
     * Sends a session-turn prompt. Expects Gemini to return JSON: {"message":"...","state_delta":{...}}
     */
    public String sendMessage(String prompt, String apiKey) throws Exception {
        return callGemini(prompt, apiKey);
    }

    private String callGemini(String prompt, String apiKey) throws Exception {
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
            "generationConfig", Map.of("responseMimeType", "application/json")
        );

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_BASE + "?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.error("Gemini error — status: {} body: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error: HTTP " + response.statusCode() + " — " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.at("/candidates/0/content/parts/0/text").asText();
    }
}
