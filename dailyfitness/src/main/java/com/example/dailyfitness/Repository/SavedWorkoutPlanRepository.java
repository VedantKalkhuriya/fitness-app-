package com.example.dailyfitness.Repository;

import com.example.dailyfitness.Entity.SavedWorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedWorkoutPlanRepository extends JpaRepository<SavedWorkoutPlan, Long> {
    List<SavedWorkoutPlan> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<SavedWorkoutPlan> findByIdAndUserId(Long id, Long userId);
    Optional<SavedWorkoutPlan> findFirstByUserIdAndActiveTrue(Long userId);
}
