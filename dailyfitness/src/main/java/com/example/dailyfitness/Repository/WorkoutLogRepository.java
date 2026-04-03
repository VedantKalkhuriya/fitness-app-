package com.example.dailyfitness.Repository;

import com.example.dailyfitness.Entity.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {

    // All workouts for a user
    List<WorkoutLog> findByUserIdOrderByWorkoutDateDesc(Long userId);

    // Workouts in a date range
    List<WorkoutLog> findByUserIdAndWorkoutDateBetween(
            Long userId, LocalDate start, LocalDate end
    );

    // Workouts by type
    List<WorkoutLog> findByUserIdAndWorkoutType(Long userId, String type);

    // Check if user worked out on a specific date
    Optional<WorkoutLog> findByUserIdAndWorkoutDate(Long userId, LocalDate date);

    // Count total workouts
    long countByUserId(Long userId);
}

