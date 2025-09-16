package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.exercise;
import com.example.dailyfitness.Repository.workoutrepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class workout {
    @Autowired 
    private workoutrepo workoutrepos;
    
    public void addworkout(exercise exercise) {
        workoutrepos.save(exercise);
        
    }
    
    public List<exercise> getallworkout(exercise exercise) {
        return workoutrepos.findAll();
    }
    public Optional<exercise> getworkoutbyid(Long id) {
        return workoutrepos.findById(id);
        
    }
    public Optional<exercise>  getworkoutbyname(String exerciseName) {
        return workoutrepos.findByExerciseName(exerciseName);
    }



    
}
