package com.example.dailyfitness.DTO;

import java.time.LocalDateTime;

public record SavedWorkoutPlanView(
        Long id,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        WorkoutPlanResponse plan
) { }
