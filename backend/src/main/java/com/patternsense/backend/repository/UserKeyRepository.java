package com.patternsense.backend.repository;

import com.patternsense.backend.entity.UserKey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserKeyRepository extends JpaRepository<UserKey, UUID> {
    Optional<UserKey> findByUserId(UUID userId);
}
