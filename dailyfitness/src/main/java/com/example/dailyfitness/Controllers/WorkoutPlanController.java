package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.SavedWorkoutPlanView;
import com.example.dailyfitness.DTO.WorkoutPlanGenerationRequest;
import com.example.dailyfitness.DTO.WorkoutPlanResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.userRepo;
import com.example.dailyfitness.service.SavedWorkoutPlanService;
import com.example.dailyfitness.service.WorkoutPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/fitness/workout-plans/{userId}")
public class WorkoutPlanController {
    private final userRepo users;
    private final WorkoutPlanService generator;
    private final SavedWorkoutPlanService plans;

    public WorkoutPlanController(userRepo users, WorkoutPlanService generator,
                                 SavedWorkoutPlanService plans) {
        this.users = users;
        this.generator = generator;
        this.plans = plans;
    }

    @GetMapping
    public List<SavedWorkoutPlanView> list(@PathVariable Long userId, Authentication authentication) {
        requireOwner(userId, authentication);
        return plans.list(userId);
    }

    @PostMapping("/generate")
    public SavedWorkoutPlanView generate(@PathVariable Long userId,
                                         @Valid @RequestBody WorkoutPlanGenerationRequest request,
                                         Authentication authentication) {
        UserProfile user = requireOwner(userId, authentication);
        try {
            WorkoutPlanResponse plan = generator.generateStructuredWorkoutPlan(user, request);
            return plans.generate(userId, plan);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage(), e);
        }
    }

    @PutMapping("/{planId}")
    public SavedWorkoutPlanView edit(@PathVariable Long userId, @PathVariable Long planId,
                                     @Valid @RequestBody WorkoutPlanResponse plan,
                                     Authentication authentication) {
        requireOwner(userId, authentication);
        try {
            return plans.edit(userId, planId, plan);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PutMapping("/{planId}/active")
    public SavedWorkoutPlanView activate(@PathVariable Long userId, @PathVariable Long planId,
                                         Authentication authentication) {
        requireOwner(userId, authentication);
        try {
            return plans.activate(userId, planId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    private UserProfile requireOwner(Long userId, Authentication authentication) {
        UserProfile user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (authentication == null || !user.getName().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own workout plans.");
        }
        return user;
    }
}
