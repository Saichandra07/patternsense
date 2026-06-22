package com.patternsense.backend.controller;

import com.patternsense.backend.entity.SessionGap;
import com.patternsense.backend.entity.WeaknessMap;
import com.patternsense.backend.repository.SessionGapRepository;
import com.patternsense.backend.repository.WeaknessMapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WeaknessController {

    private final WeaknessMapRepository weaknessMapRepository;
    private final SessionGapRepository sessionGapRepository;

    @GetMapping("/weakness")
    public List<Map<String, Object>> weakness(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());

        List<WeaknessMap> weaknesses = weaknessMapRepository.findByUserId(userId);
        List<SessionGap> allGaps = sessionGapRepository.findByUserId(userId);

        // Most recent gap per pattern
        Map<String, SessionGap> latestGapByPattern = new HashMap<>();
        for (SessionGap gap : allGaps) {
            latestGapByPattern.merge(gap.getPattern(), gap, (existing, incoming) ->
                    (incoming.getCreatedAt() != null && existing.getCreatedAt() != null &&
                     incoming.getCreatedAt().isAfter(existing.getCreatedAt())) ? incoming : existing);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (WeaknessMap w : weaknesses) {
            SessionGap latestGap = latestGapByPattern.get(w.getPattern());
            Map<String, Object> entry = new HashMap<>();
            entry.put("pattern", w.getPattern());
            entry.put("confidenceScore", w.getConfidenceScore());
            entry.put("lastUpdated", w.getLastUpdated() != null ? w.getLastUpdated().toString() : null);
            entry.put("recentGapNote", latestGap != null ? latestGap.getGapNote() : null);
            result.add(entry);
        }
        return result;
    }
}
