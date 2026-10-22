package com.example.dailyfitness.DTO;

import java.time.LocalDateTime;

public record SavedDietPlanView(Long id, LocalDateTime createdAt, DietPlanResponse plan) { }
