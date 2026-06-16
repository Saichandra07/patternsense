package com.patternsense.backend.controller;

import com.patternsense.backend.service.KeyService;
import com.patternsense.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final KeyService keyService;

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
