package com.patternsense.backend.controller;

import com.patternsense.backend.service.KeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/keys")
@RequiredArgsConstructor
public class KeyController {

    private final KeyService keyService;

    @PostMapping("/save")
    public ResponseEntity<Map<String, String>> saveKey(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        String apiKey = body.get("apiKey");
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "apiKey is required"));
        }
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            keyService.saveKey(userId, apiKey.trim());
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save key"));
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Map<String, String>> removeKey(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        keyService.removeKey(userId);
        return ResponseEntity.ok(Map.of("status", "removed"));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> keyStatus(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(Map.of("hasKey", keyService.hasKey(userId)));
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateKey(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        boolean valid = keyService.validateStoredKey(userId);
        return ResponseEntity.ok(Map.of("valid", valid));
    }
}
