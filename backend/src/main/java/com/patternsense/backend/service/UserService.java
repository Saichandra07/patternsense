package com.patternsense.backend.service;

import com.patternsense.backend.entity.AppUser;
import com.patternsense.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public AppUser syncUser(UUID userId, String email) {
        return userRepository.findById(userId).orElseGet(() -> {
            AppUser user = new AppUser();
            user.setId(userId);
            user.setEmail(email);
            user.setCreatedAt(OffsetDateTime.now());
            return userRepository.save(user);
        });
    }

    public void setMode(UUID userId, String mode) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        user.setMode(mode);
        userRepository.save(user);
    }

    public String getMode(UUID userId) {
        return userRepository.findById(userId)
                .map(AppUser::getMode)
                .orElse(null);
    }
}
