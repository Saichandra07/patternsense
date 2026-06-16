package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "weakness_map")
@Data
@NoArgsConstructor
public class WeaknessMap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String pattern;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "last_updated")
    private OffsetDateTime lastUpdated;
}
