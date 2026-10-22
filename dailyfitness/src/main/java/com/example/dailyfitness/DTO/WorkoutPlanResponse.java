package com.example.dailyfitness.DTO;

import lombok.Data;

import java.util.List;

// Workout plan structure
@Data
public class WorkoutPlanResponse {
    private String planName;
    private String goal;
    private String experienceLevel;
    private int trainingDaysPerWeek;
    private int estimatedSessionMinutes;
    private List<String> targetMuscleGroups;
    private List<DayWorkout> weekPlan;
    private String generalTip;

    @Data
    public static class DayWorkout {
        private String day;
        private boolean isRestDay;
        private String focus;
        private int estimatedDurationMinutes;
        private List<Exercise> exercises;

        @Data
        public static class Exercise {
            private String name;
            private List<String> targetMuscles;
            private int sets;
            private String repetitions;
            private int restSeconds;
            private String equipment;
            private String instructions;
        }
    }
}
