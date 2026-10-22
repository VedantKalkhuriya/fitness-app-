package com.example.dailyfitness.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MealSubstitutionRequest {
    @NotBlank @Size(max = 30)
    private String dietaryPreference;
    @Size(max = 1000)
    private String restrictions;
    @NotBlank @Size(max = 30)
    private String mealType;
    @NotBlank @Size(max = 120)
    private String currentMealName;
    @Size(max = 100)
    private String ingredientToReplace;
    @Valid
    private DietPlanResponse.Meal currentMeal;
}
