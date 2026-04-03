package com.example.dailyfitness.DTO;

import lombok.Data;

import java.util.List;

// Workout plan structure
@Data
public class WorkoutPlanResponse {
    private String goal;
    private List<DayWorkout> weekPlan;
    private String generalTip;

    @Data
    public static class DayWorkout {
        private String day;
        private boolean isRestDay;
        private List<Exercise> exercises;

        @Data
        public static class Exercise {
            private String name;
            private int sets;
            private int reps;
            private String restTime;
        }
    }
}
