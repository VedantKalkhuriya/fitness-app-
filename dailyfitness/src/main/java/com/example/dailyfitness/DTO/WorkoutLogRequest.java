package com.example.dailyfitness.DTO;

import lombok.Data;

import java.util.List;

@Data
public class WorkoutLogRequest {
    private String workoutType;       // "Chest", "Legs" etc
    private int durationMinutes;
    private String feeling;           // "Great", "Average", "Tired"
    private int caloriesBurned;
    private List<ExerciseLogRequest> exercises;

    @Data
    public static class ExerciseLogRequest {
        private String exerciseName;
        private int sets;
        private int reps;
        private double weightKg;
        private String notes;
    }
}