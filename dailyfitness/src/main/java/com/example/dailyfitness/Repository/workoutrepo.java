package com.example.dailyfitness.Repository;
import com.example.dailyfitness.Entity.exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface workoutrepo extends JpaRepository <exercise,Long> {

    Optional<exercise> findByExerciseName(String exerciseName);
}
