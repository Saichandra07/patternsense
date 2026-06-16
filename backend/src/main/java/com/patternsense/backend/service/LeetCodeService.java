package com.patternsense.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.patternsense.backend.entity.Problem;
import com.patternsense.backend.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LeetCodeService {

    private final ProblemRepository problemRepository;
    private final ObjectMapper objectMapper;

    private static final String GRAPHQL_URL = "https://leetcode.com/graphql";
    private static final Pattern SLUG_PATTERN = Pattern.compile("leetcode\\.com/problems/([a-z0-9-]+)");

    public Problem fetchAndCache(String url) throws Exception {
        String slug = extractSlug(url);

        Optional<Problem> cached = problemRepository.findBySlug(slug);
        if (cached.isPresent()) {
            return cached.get();
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query",
            "query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { title difficulty topicTags { name } content } }");
        requestBody.put("variables", Map.of("titleSlug", slug));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GRAPHQL_URL))
                .header("Content-Type", "application/json")
                .header("Referer", "https://leetcode.com")
                .header("User-Agent", "Mozilla/5.0")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("LeetCode fetch failed: HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode question = root.at("/data/question");
        if (question.isMissingNode() || question.isNull()) {
            throw new IllegalArgumentException("Problem not found on LeetCode: " + slug);
        }

        String title = question.at("/title").asText();
        String difficulty = question.at("/difficulty").asText().toLowerCase();
        String htmlContent = question.at("/content").asText("");

        JsonNode tagsNode = question.at("/topicTags");
        String[] topicTags = new String[tagsNode.size()];
        for (int i = 0; i < tagsNode.size(); i++) {
            topicTags[i] = tagsNode.get(i).at("/name").asText();
        }

        Problem problem = new Problem();
        problem.setSlug(slug);
        problem.setTitle(title);
        problem.setDifficulty(difficulty);
        problem.setTopicTags(topicTags);
        problem.setPatternTags(new String[]{});
        problem.setDescription(stripHtml(htmlContent));
        problem.setSource("leetcode");
        problem.setCreatedAt(OffsetDateTime.now());

        return problemRepository.save(problem);
    }

    public String extractSlug(String url) {
        Matcher matcher = SLUG_PATTERN.matcher(url);
        if (!matcher.find()) {
            throw new IllegalArgumentException("Not a valid LeetCode problem URL");
        }
        return matcher.group(1);
    }

    private String stripHtml(String html) {
        if (html == null || html.isBlank()) return "";
        return html
                .replaceAll("<[^>]*>", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&nbsp;", " ")
                .replace("&#39;", "'")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
