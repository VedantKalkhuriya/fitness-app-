package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.DietPlanResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.userRepo;
import com.example.dailyfitness.service.DietPlanService;
import com.example.dailyfitness.service.FeedbackService;
import com.example.dailyfitness.service.WorkoutPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/fitness")
public class FitnessController {

    @Autowired
    DietPlanService dietPlanService;
    @Autowired
    WorkoutPlanService workoutPlanService;
    @Autowired
    FeedbackService feedbackService;
    @Autowired
    userRepo userRepo;

    @PostMapping("/diet/{userId}")
    public ResponseEntity<DietPlanResponse> getDietPlan(@PathVariable Long userId) {
        UserProfile user = userRepo.findById(userId).orElseThrow();
        DietPlanResponse plan = dietPlanService.generateDietPlan(user);
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/workout/{userId}")
    public ResponseEntity<String> getWorkoutPlan(@PathVariable Long userId) {
        UserProfile user = userRepo.findById(userId).orElseThrow();
        String plan = workoutPlanService.generateWorkoutPlan(user);
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/feedback/{userId}")
    public ResponseEntity<String> getFeedback(@PathVariable Long userId,
                                              @RequestBody String progressLog) {
        UserProfile user = userRepo.findById(userId).orElseThrow();
        String plan = feedbackService.getFeedback(user, progressLog);
        return ResponseEntity.ok(plan);
    }//go to body -> raw -> select plane text and send
}