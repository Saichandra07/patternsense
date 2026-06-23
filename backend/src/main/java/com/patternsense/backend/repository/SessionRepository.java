package com.patternsense.backend.repository;

import com.patternsense.backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findByUserId(UUID userId);
    Optional<Session> findByIdAndUserId(UUID id, UUID userId);
    Optional<Session> findFirstByProblemIdAndProblemBriefIsNotNull(UUID problemId);
    List<Session> findTop5ByUserIdAndStatusOrderByCompletedAtDesc(UUID userId, String status);
    List<Session> findByUserIdAndStatus(UUID userId, String status);
    List<Session> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);
}
