package com.patternsense.backend.repository;

import com.patternsense.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findBySessionIdOrderByTurnNumberAsc(UUID sessionId);
    int countBySessionId(UUID sessionId);
}
