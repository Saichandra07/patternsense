package com.patternsense.backend.controller;

import com.patternsense.backend.entity.Problem;
import com.patternsense.backend.entity.Session;
import com.patternsense.backend.entity.SessionGap;
import com.patternsense.backend.repository.ProblemRepository;
import com.patternsense.backend.repository.SessionGapRepository;
import com.patternsense.backend.repository.SessionRepository;
import com.patternsense.backend.service.KeyService;
import com.patternsense.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final KeyService keyService;
    private final SessionRepository sessionRepository;
    private final ProblemRepository problemRepository;
    private final SessionGapRepository sessionGapRepository;

    @GetMapping("/me")
    public Map<String, String> me(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("userId", jwt.getSubject());
    }

    @PostMapping("/users/sync")
    public Map<String, String> sync(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        userService.syncUser(userId, email);
        return Map.of("status", "ok");
    }

    @GetMapping("/users/profile")
    public Map<String, Object> profile(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId.toString());
        result.put("email", jwt.getClaimAsString("email"));
        result.put("mode", userService.getMode(userId));
        result.put("hasKey", keyService.hasKey(userId));
        return result;
    }

    @GetMapping("/sessions/recent")
    public List<Map<String, Object>> recentSessions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<Session> sessions = sessionRepository.findTop5ByUserIdAndStatusOrderByCompletedAtDesc(userId, "complete");
        List<Map<String, Object>> result = new ArrayList<>();
        for (Session s : sessions) {
            Problem problem = s.getProblemId() != null
                    ? problemRepository.findById(s.getProblemId()).orElse(null)
                    : null;
            SessionGap gap = sessionGapRepository.findTopBySessionIdOrderByCreatedAtDesc(s.getId()).orElse(null);
            Map<String, Object> entry = new HashMap<>();
            entry.put("sessionId", s.getId().toString());
            entry.put("problemTitle", problem != null ? problem.getTitle() : "Unknown");
            entry.put("difficulty", problem != null ? problem.getDifficulty() : null);
            entry.put("pattern", gap != null ? gap.getPattern() : null);
            entry.put("gapNote", gap != null ? gap.getGapNote() : null);
            entry.put("completedAt", s.getCompletedAt() != null ? s.getCompletedAt().toString() : null);
            result.add(entry);
        }
        return result;
    }

    @PatchMapping("/users/mode")
    public Map<String, String> setMode(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String mode = body.get("mode");
        if (!mode.equals("guided") && !mode.equals("self_directed")) {
            throw new IllegalArgumentException("Invalid mode");
        }
        userService.setMode(userId, mode);
        return Map.of("status", "ok");
    }
}
