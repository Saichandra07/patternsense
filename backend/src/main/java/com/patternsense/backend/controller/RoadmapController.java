package com.patternsense.backend.controller;

import com.patternsense.backend.entity.Problem;
import com.patternsense.backend.entity.Session;
import com.patternsense.backend.repository.ProblemRepository;
import com.patternsense.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roadmap")
@RequiredArgsConstructor
public class RoadmapController {

    private final SessionRepository sessionRepository;
    private final ProblemRepository problemRepository;

    @GetMapping("/progress")
    public Map<String, Object> progress(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<Session> completedSessions = sessionRepository.findByUserIdAndStatus(userId, "complete");
        List<String> completedSlugs = completedSessions.stream()
                .map(s -> s.getProblemId() != null
                        ? problemRepository.findById(s.getProblemId()).map(Problem::getSlug).orElse(null)
                        : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        return Map.of("completedSlugs", completedSlugs);
    }
}
