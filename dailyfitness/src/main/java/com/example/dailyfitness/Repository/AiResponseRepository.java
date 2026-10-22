package com.example.dailyfitness.Repository;

import com.example.dailyfitness.Entity.AiResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiResponseRepository extends JpaRepository<AiResponse, Long> {

    // Get all responses for a user
    List<AiResponse> findByUserId(Long userId);

    List<AiResponse> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Get responses by type (DIET / WORKOUT / FEEDBACK)
    List<AiResponse> findByUserIdAndType(Long userId, String type);

    List<AiResponse> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type);

    // Get latest response for a user by type
    Optional<AiResponse> findTopByUserIdAndTypeOrderByCreatedAtDesc(
            Long userId, String type
    );

    Optional<AiResponse> findByIdAndUserIdAndType(Long id, Long userId, String type);
}
