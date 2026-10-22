package com.example.dailyfitness.DTO;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

@Data
public class WorkoutLogRequest {
    @NotBlank @Size(max = 100)
    private String workoutType;
    private LocalDate workoutDate;
    @Size(max = 1000)
    private String notes;
    @Size(max = 64)
    private String submissionId;
    @Min(1) @Max(600)
    private int durationMinutes;
    @NotBlank @Pattern(regexp = "Great|Average|Tired")
    private String feeling;
    @Min(0) @Max(10000)
    private int caloriesBurned;
    @NotEmpty @Valid
    private List<ExerciseLogRequest> exercises;

    @Data
    public static class ExerciseLogRequest {
        @NotBlank @Size(max = 150)
        private String exerciseName;
        @Min(1) @Max(100)
        private int sets;
        @Min(0) @Max(1000)
        private int reps;
        @DecimalMin("0") @DecimalMax("2000")
        private double weightKg;
        @Size(max = 1000)
        private String notes;
        @Valid
        private List<SetRequest> setDetails;
    }

    @Data
    public static class SetRequest {
        @Min(1) @Max(100)
        private int setNumber;
        @Min(1) @Max(1000)
        private int reps;
        @DecimalMin("0") @DecimalMax("2000")
        private double weightKg;
        private boolean completed;
        @Size(max = 500)
        private String notes;
    }
}
