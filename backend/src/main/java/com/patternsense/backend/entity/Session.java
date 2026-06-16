package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "problem_id")
    private UUID problemId;

    @Column(name = "problem_brief")
    private String problemBrief;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "session_state", columnDefinition = "jsonb", nullable = false)
    private String sessionState;

    private String status;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
