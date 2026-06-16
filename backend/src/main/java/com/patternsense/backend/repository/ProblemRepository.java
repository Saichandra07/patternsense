package com.patternsense.backend.repository;

import com.patternsense.backend.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    Optional<Problem> findBySlug(String slug);
}
