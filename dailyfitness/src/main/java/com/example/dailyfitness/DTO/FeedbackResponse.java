package com.example.dailyfitness.DTO;

import lombok.Data;

import java.util.List;

// Feedback structure
@Data
public class FeedbackResponse {
    private String overallRating;     // "Good", "Needs Improvement"
    private List<String> strengths;
    private List<String> improvements;
    private String nextWeekTip;
    private int progressPercentage;
}
