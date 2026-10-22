package com.example.dailyfitness.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class DietPlanResponse {
    @NotBlank @Size(max = 1200)
    private String summary;
    @NotEmpty @Size(min = 1, max = 7) @Valid
    private List<DayMeal> weekPlan;
    @Min(0) @Max(10000)
    private Integer totalDailyCalories;
    @Min(0) @Max(1000)
    private Integer proteinGrams;
    @Min(0) @Max(1500)
    private Integer carbohydrateGrams;
    @Min(0) @Max(1000)
    private Integer fatGrams;
    @Size(max = 500)
    private String hydrationTip;

    @Data
    public static class DayMeal {
        @NotBlank @Size(max = 20)
        private String day;
        @Min(0) @Max(10000)
        private Integer calories;
        @Min(0) @Max(1000)
        private Integer proteinGrams;
        @Min(0) @Max(1500)
        private Integer carbohydrateGrams;
        @Min(0) @Max(1000)
        private Integer fatGrams;
        @NotEmpty @Size(min = 3, max = 6) @Valid
        private List<Meal> meals;
        // Legacy fields remain readable for old structured clients; new plans use `meals`.
        private String breakfast;
        private String lunch;
        private String dinner;
        private String snack;
    }

    @Data
    public static class Meal {
        @NotBlank @Size(max = 30)
        private String mealType;
        @NotBlank @Size(max = 160)
        private String name;
        @Size(max = 20) @Valid
        private List<Ingredient> ingredients;
        @Size(max = 1600)
        private String instructions;
        @Min(0) @Max(10000)
        private Integer calories;
        @Min(0) @Max(1000)
        private Integer proteinGrams;
        @Min(0) @Max(1500)
        private Integer carbohydrateGrams;
        @Min(0) @Max(1000)
        private Integer fatGrams;
    }

    @Data
    public static class Ingredient {
        @NotBlank @Size(max = 100)
        private String name;
        @Min(0) @Max(100000)
        private Double quantity;
        @Size(max = 30)
        private String unit;
    }
}
