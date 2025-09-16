package com.example.dailyfitness.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@Getter
@Setter
@Entity
@Table(name = "workout")

public class exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  long id;
    private  String exerciseName ;
    private  String targetmuscel ;
    private  int sets  ;
    private  int weight ;
}
