package com.patternsense.backend.repository;

import com.patternsense.backend.entity.RoadmapProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RoadmapProgressRepository extends JpaRepository<RoadmapProgress, UUID> {
    List<RoadmapProgress> findByUserId(UUID userId);
}
