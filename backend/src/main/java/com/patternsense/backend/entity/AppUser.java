package com.patternsense.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class AppUser {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    private String mode;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
