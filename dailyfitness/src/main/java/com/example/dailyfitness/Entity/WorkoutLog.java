package com.example.dailyfitness.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutLog{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private LocalDate workoutDate;

    private String workoutType;      // "Chest", "Legs", "Cardio", "Full Body"

    private int durationMinutes;     // how long they worked out

    private String feeling;          // "Great", "Average", "Tired"

    private int caloriesBurned;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "workout_log_id")
    private List<ExerciseLog> exercises;  // individual exercises done

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;       // AI feedback on this session

    @PrePersist
    public void prePersist() {
        if (this.workoutDate == null) {
            this.workoutDate = LocalDate.now();
        }
    }
}