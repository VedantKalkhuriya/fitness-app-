package com.example.dailyfitness.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_workout_plans")
@Getter
@Setter
@NoArgsConstructor
public class SavedWorkoutPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String planName;

    @Column(nullable = false)
    private String goal;

    @Column(nullable = false)
    private String experienceLevel;

    @Column(nullable = false)
    private int trainingDaysPerWeek;

    @Column(nullable = false)
    private int estimatedSessionMinutes;

    @Column(nullable = false)
    private boolean active;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String planJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
