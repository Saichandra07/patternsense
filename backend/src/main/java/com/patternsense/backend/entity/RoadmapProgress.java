package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "roadmap_progress")
@Data
@NoArgsConstructor
public class RoadmapProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String pattern;

    @Column(name = "problem_slug")
    private String problemSlug;

    private String status;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
