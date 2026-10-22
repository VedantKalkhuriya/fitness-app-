package com.example.dailyfitness.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DietPlanGenerationRequest {
    @NotBlank @Size(max = 40)
    private String dietaryPreference;
    @Size(max = 1000)
    private String restrictions;
    @Size(max = 100)
    private String budget;
    @Size(max = 600)
    private String availableIngredients;
    @Min(3) @Max(6)
    private int mealsPerDay = 4;
    @Size(max = 80)
    private String fitnessGoal;
}
