package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_gaps")
@Data
@NoArgsConstructor
public class SessionGap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String pattern;

    @Column(name = "gap_note")
    private String gapNote;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
