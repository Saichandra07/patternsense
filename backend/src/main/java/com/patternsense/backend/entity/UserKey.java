package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_keys")
@Data
@NoArgsConstructor
public class UserKey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", unique = true, nullable = false)
    private UUID userId;

    @Column(name = "encrypted_key", nullable = false)
    private String encryptedKey;

    @Column(nullable = false)
    private String iv;

    @Column(nullable = false)
    private String provider;  // "gemini" or "groq"

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
