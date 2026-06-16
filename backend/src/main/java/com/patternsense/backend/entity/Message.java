package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id")
    private UUID sessionId;

    private String role;

    @Column(nullable = false)
    private String content;

    @Column(name = "turn_number", nullable = false)
    private Integer turnNumber;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
