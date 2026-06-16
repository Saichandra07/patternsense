package com.patternsense.backend.repository;

import com.patternsense.backend.entity.SessionGap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SessionGapRepository extends JpaRepository<SessionGap, UUID> {
    List<SessionGap> findByUserId(UUID userId);
}
