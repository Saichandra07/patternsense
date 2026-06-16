package com.patternsense.backend.controller;

import com.patternsense.backend.entity.Problem;
import com.patternsense.backend.service.LeetCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final LeetCodeService leetCodeService;

    @GetMapping("/fetch")
    public ResponseEntity<Map<String, Object>> fetchProblem(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String url) {
        try {
            Problem problem = leetCodeService.fetchAndCache(url);
            Map<String, Object> result = new HashMap<>();
            result.put("slug", problem.getSlug());
            result.put("title", problem.getTitle());
            result.put("difficulty", problem.getDifficulty());
            result.put("topicTags", problem.getTopicTags());
            result.put("description", problem.getDescription());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch problem: " + e.getMessage()));
        }
    }
}
