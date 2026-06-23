package com.patternsense.backend.repository;

import com.patternsense.backend.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    Optional<Problem> findBySlug(String slug);

    @Modifying
    @Query("UPDATE Problem p SET p.title = :title, p.difficulty = :difficulty, p.description = :description, p.topicTags = :topicTags WHERE p.slug = :slug")
    void updateBySlug(@Param("slug") String slug,
                      @Param("title") String title,
                      @Param("difficulty") String difficulty,
                      @Param("description") String description,
                      @Param("topicTags") String[] topicTags);
}
