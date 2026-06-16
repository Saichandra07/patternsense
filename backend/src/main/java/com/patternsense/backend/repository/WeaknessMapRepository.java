package com.patternsense.backend.repository;

import com.patternsense.backend.entity.WeaknessMap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeaknessMapRepository extends JpaRepository<WeaknessMap, UUID> {
    List<WeaknessMap> findByUserId(UUID userId);
    Optional<WeaknessMap> findByUserIdAndPattern(UUID userId, String pattern);
}
