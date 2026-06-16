package com.patternsense.backend.repository;

import com.patternsense.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
}
