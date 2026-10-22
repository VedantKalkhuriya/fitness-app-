package com.example.dailyfitness.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "workout")

public class ExerciseLog  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  long id;
    private  String exerciseName ;
    private  double weightKg ;
    private  int sets  ;
    private  int weight ;
    private int reps;
    private String notes ;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "exercise_log_id")
    private List<ExerciseSetLog> setDetails = new ArrayList<>();
}
