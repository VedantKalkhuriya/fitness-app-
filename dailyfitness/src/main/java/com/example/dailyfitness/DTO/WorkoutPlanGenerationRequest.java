package com.example.dailyfitness.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class WorkoutPlanGenerationRequest {
    @NotBlank private String goal;
    @NotBlank @Pattern(regexp = "beginner|intermediate|advanced") private String experienceLevel;
    @NotEmpty @Size(max = 4) private List<@NotBlank String> equipment;
    @Min(2) @Max(7) private int trainingDaysPerWeek;
    @Min(15) @Max(180) private int sessionDurationMinutes;
    @Size(max = 500) private String limitations;
}
