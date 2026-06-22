package com.patternsense.backend.controller;

import com.patternsense.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionController {

    private static final Logger log = LoggerFactory.getLogger(SessionController.class);
    private final SessionService sessionService;

    private static String msg(Exception e) {
        String m = e.getMessage();
        return m != null ? m : e.getClass().getSimpleName();
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            String url = body.get("url");
            if (url == null || url.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "url is required"));
            return ResponseEntity.ok(sessionService.startSession(userId, url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (Exception e) {
            log.error("start() failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", msg(e)));
        }
    }

    @PostMapping("/{sessionId}/message")
    public ResponseEntity<Map<String, Object>> message(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID sessionId,
            @RequestBody Map<String, String> body) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            String content = body.get("content");
            if (content == null || content.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "content is required"));
            return ResponseEntity.ok(sessionService.sendMessage(userId, sessionId, content));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (Exception e) {
            log.error("message() failed for session {}", sessionId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", msg(e)));
        }
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<Map<String, Object>> end(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID sessionId) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            return ResponseEntity.ok(sessionService.endSession(userId, sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (Exception e) {
            log.error("end() failed for session {}", sessionId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", msg(e)));
        }
    }

    @PostMapping("/{sessionId}/stuck")
    public ResponseEntity<Map<String, Object>> stuck(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID sessionId) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            return ResponseEntity.ok(sessionService.stuck(userId, sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", msg(e)));
        } catch (Exception e) {
            log.error("stuck() failed for session {}", sessionId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", msg(e)));
        }
    }
}
