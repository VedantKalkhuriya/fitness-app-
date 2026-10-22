package com.example.dailyfitness.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exercise_set")
@Getter
@Setter
public class ExerciseSetLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int setNumber;
    private int reps;
    private double weightKg;
    private boolean completed;
    private String notes;
}
