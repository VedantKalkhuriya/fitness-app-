package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.DietPlanResponse;
import com.example.dailyfitness.DTO.DietPlanGenerationRequest;
import com.example.dailyfitness.DTO.FeedbackRequest;
import com.example.dailyfitness.DTO.MealSubstitutionRequest;
import com.example.dailyfitness.DTO.SavedDietPlanView;
import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import com.example.dailyfitness.Repository.userRepo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.dailyfitness.service.DietPlanService;
import com.example.dailyfitness.service.FeedbackService;
import com.example.dailyfitness.service.WorkoutPlanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    @Autowired
    AiResponseRepository aiResponseRepository;
    @Autowired
    ObjectMapper objectMapper;

    @PostMapping("/diet/{userId}")
    public ResponseEntity<SavedDietPlanView> getDietPlan(@PathVariable Long userId,
            @Valid @RequestBody DietPlanGenerationRequest request, Authentication authentication) {
        UserProfile user = requireOwner(userId, authentication);
        AiResponse saved = dietPlanService.generateDietPlan(user, request);
        return ResponseEntity.ok(toDietPlanView(saved));
    }

    @GetMapping("/diet/{userId}")
    public ResponseEntity<List<SavedDietPlanView>> getSavedDietPlans(@PathVariable Long userId,
            Authentication authentication) {
        requireOwner(userId, authentication);
        List<SavedDietPlanView> plans = aiResponseRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, "DIET")
                .stream().map(this::toDietPlanViewOrNull).toList();
        return ResponseEntity.ok(plans);
    }

    @PutMapping("/diet/{userId}/{planId}")
    public ResponseEntity<SavedDietPlanView> saveDietPlan(@PathVariable Long userId, @PathVariable Long planId,
            @Valid @RequestBody DietPlanResponse plan, Authentication authentication) {
        requireOwner(userId, authentication);
        dietPlanService.validatePlan(plan);
        AiResponse saved = aiResponseRepository.findByIdAndUserIdAndType(planId, userId, "DIET")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved meal plan not found."));
        try {
            saved.setResponse(objectMapper.writeValueAsString(plan));
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The meal plan could not be saved.");
        }
        return ResponseEntity.ok(toDietPlanView(aiResponseRepository.save(saved)));
    }

    @PostMapping("/diet/{userId}/substitute")
    public ResponseEntity<DietPlanResponse.Meal> substituteMeal(@PathVariable Long userId,
            @Valid @RequestBody MealSubstitutionRequest request, Authentication authentication) {
        UserProfile user = requireOwner(userId, authentication);
        return ResponseEntity.ok(dietPlanService.substituteMeal(user, request));
    }

    @PostMapping("/workout/{userId}")
    public ResponseEntity<String> getWorkoutPlan(@PathVariable Long userId) {
        UserProfile user = userRepo.findById(userId).orElseThrow();
        String plan = workoutPlanService.generateWorkoutPlan(user);
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/feedback/{userId}")
    public ResponseEntity<String> getFeedback(@PathVariable Long userId,
                                              @Valid @RequestBody FeedbackRequest request,
                                              Authentication authentication) {
        UserProfile user = requireOwner(userId, authentication);
        String plan = feedbackService.getFeedback(user, request.getPrompt());
        return ResponseEntity.ok(plan);
    }

    private UserProfile requireOwner(Long userId, Authentication authentication) {
        UserProfile user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (authentication == null || !user.getName().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only request coaching for your own account.");
        }
        return user;
    }

    private SavedDietPlanView toDietPlanView(AiResponse saved) {
        try {
            DietPlanResponse plan = objectMapper.readValue(saved.getResponse(), DietPlanResponse.class);
            return new SavedDietPlanView(saved.getId(), saved.getCreatedAt(), plan);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "A saved meal plan could not be read.");
        }
    }

    private SavedDietPlanView toDietPlanViewOrNull(AiResponse saved) {
        try { return toDietPlanView(saved); }
        catch (ResponseStatusException ignored) {
            return new SavedDietPlanView(saved.getId(), saved.getCreatedAt(), null);
        }
    }
}
