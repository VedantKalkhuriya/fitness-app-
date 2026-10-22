package com.example.dailyfitness.service;

import com.example.dailyfitness.DTO.SavedWorkoutPlanView;
import com.example.dailyfitness.DTO.WorkoutPlanResponse;
import com.example.dailyfitness.Entity.SavedWorkoutPlan;
import com.example.dailyfitness.Repository.SavedWorkoutPlanRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SavedWorkoutPlanService {
    private final SavedWorkoutPlanRepository repository;
    private final WorkoutPlanService generator;
    private final ObjectMapper objectMapper;

    public SavedWorkoutPlanService(SavedWorkoutPlanRepository repository,
                                   WorkoutPlanService generator,
                                   ObjectMapper objectMapper) {
        this.repository = repository;
        this.generator = generator;
        this.objectMapper = objectMapper;
    }

    public List<SavedWorkoutPlanView> list(Long userId) {
        return repository.findByUserIdOrderByUpdatedAtDesc(userId).stream().map(this::view).toList();
    }

    public SavedWorkoutPlanView generate(Long userId, WorkoutPlanResponse plan) {
        SavedWorkoutPlan saved = new SavedWorkoutPlan();
        saved.setUserId(userId);
        saved.setActive(repository.findFirstByUserIdAndActiveTrue(userId).isEmpty());
        writePlan(saved, plan);
        return view(repository.save(saved));
    }

    public SavedWorkoutPlanView edit(Long userId, Long planId, WorkoutPlanResponse plan) {
        SavedWorkoutPlan saved = repository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Workout plan not found."));
        generator.validatePlan(plan, plan.getTrainingDaysPerWeek());
        writePlan(saved, plan);
        return view(repository.save(saved));
    }

    @Transactional
    public SavedWorkoutPlanView activate(Long userId, Long planId) {
        SavedWorkoutPlan selected = repository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Workout plan not found."));
        repository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(SavedWorkoutPlan::isActive)
                .forEach(plan -> plan.setActive(false));
        selected.setActive(true);
        return view(repository.save(selected));
    }

    private void writePlan(SavedWorkoutPlan saved, WorkoutPlanResponse plan) {
        try {
            saved.setPlanName(plan.getPlanName());
            saved.setGoal(plan.getGoal());
            saved.setExperienceLevel(plan.getExperienceLevel());
            saved.setTrainingDaysPerWeek(plan.getTrainingDaysPerWeek());
            saved.setEstimatedSessionMinutes(plan.getEstimatedSessionMinutes());
            saved.setPlanJson(objectMapper.writeValueAsString(plan));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not save this workout plan.", e);
        }
    }

    private SavedWorkoutPlanView view(SavedWorkoutPlan saved) {
        try {
            return new SavedWorkoutPlanView(saved.getId(), saved.isActive(), saved.getCreatedAt(),
                    saved.getUpdatedAt(), objectMapper.readValue(saved.getPlanJson(), WorkoutPlanResponse.class));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("A saved workout plan could not be read.", e);
        }
    }
}
