package com.example.dailyfitness.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkoutSummary {
    private int workoutsThisWeek;
    private int totalMinutesThisWeek;
    private int totalCaloriesThisWeek;
    private int currentStreak;          // days in a row
    private long totalWorkoutsAllTime;
    private String aiWeeklyAnalysis;
}
