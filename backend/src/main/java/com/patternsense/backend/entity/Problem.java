package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "problems")
@Data
@NoArgsConstructor
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String difficulty;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "topic_tags", columnDefinition = "text[]")
    private String[] topicTags;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "pattern_tags", columnDefinition = "text[]")
    private String[] patternTags;

    private String description;

    private String source;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
