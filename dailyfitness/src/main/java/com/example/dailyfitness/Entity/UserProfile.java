package com.example.dailyfitness.Entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usersdetails")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name ;

    private int age ;
    private double height ;
    private double weight ;
    private String gender ;
    private String goal ;

    @Column(nullable = false)
    private String password;

    private String roles;

    private String activityLevel;
    private String dietPreference;
}



