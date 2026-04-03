package com.example.dailyfitness.DTO;

import lombok.Data;

import java.util.List;

// Diet plan structure
@Data
public class DietPlanResponse {
    private String summary;
    private List<DayMeal> weekPlan;
    private int totalDailyCalories;
    private String hydrationTip;

    @Data
    public static class DayMeal {
        private String day;           // "Monday"
        private String breakfast;
        private String lunch;
        private String dinner;
        private String snack;
        private int calories;
    }
}