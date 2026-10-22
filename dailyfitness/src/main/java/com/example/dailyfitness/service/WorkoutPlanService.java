package com.example.dailyfitness.service;


import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.DTO.WorkoutPlanGenerationRequest;
import com.example.dailyfitness.DTO.WorkoutPlanResponse;
import com.example.dailyfitness.Repository.AiResponseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkoutPlanService {
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    @Autowired
    private AiResponseRepository aiResponseRepository;

    public WorkoutPlanService(ChatClient.Builder builder, ObjectMapper objectMapper) {
        this.chatClient = builder.build();
        this.objectMapper = objectMapper;
    }

    public WorkoutPlanResponse generateStructuredWorkoutPlan(UserProfile user,
                                                               WorkoutPlanGenerationRequest request) {
        String prompt = """
            Return only valid JSON matching this shape, with exactly seven weekPlan entries in Monday-to-Sunday order:
            {"planName":"...","goal":"...","experienceLevel":"...","trainingDaysPerWeek":3,"estimatedSessionMinutes":45,"targetMuscleGroups":["..."],"generalTip":"...","weekPlan":[{"day":"Monday","restDay":false,"focus":"...","estimatedDurationMinutes":45,"exercises":[{"name":"...","targetMuscles":["..."],"sets":3,"repetitions":"8-12","restSeconds":90,"equipment":"...","instructions":"..."}]}]}
            Include a rest day entry for each non-training day. Schedule exactly the requested number of training days.
            Do not include markdown. Do not invent medical advice. Respect the user's limitations and equipment.

            User profile goal: %s
            Requested goal: %s
            Experience: %s
            Available equipment: %s
            Training days per week: %d
            Session duration in minutes: %d
            Limitations: %s
            """.formatted(
                user.getGoal(), request.getGoal(), request.getExperienceLevel(),
                String.join(", ", request.getEquipment()), request.getTrainingDaysPerWeek(),
                request.getSessionDurationMinutes(),
                request.getLimitations() == null || request.getLimitations().isBlank() ? "None supplied" : request.getLimitations()
        );

        String response = chatClient.prompt()
                .system("You are a careful fitness coach. Generate practical plans and follow the requested JSON schema exactly.")
                .user(prompt)
                .call()
                .content();

        try {
            String json = response.trim()
                    .replaceFirst("^```(?:json)?\\s*", "")
                    .replaceFirst("\\s*```$", "");
            WorkoutPlanResponse plan = objectMapper.readValue(json, WorkoutPlanResponse.class);
            plan.setGoal(request.getGoal());
            plan.setExperienceLevel(request.getExperienceLevel());
            plan.setTrainingDaysPerWeek(request.getTrainingDaysPerWeek());
            plan.setEstimatedSessionMinutes(request.getSessionDurationMinutes());
            validatePlan(plan, request.getTrainingDaysPerWeek());
            return plan;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("The generated plan was not valid structured data. Please try again.", e);
        }
    }

    public void validatePlan(WorkoutPlanResponse plan, int expectedTrainingDays) {
        if (plan.getWeekPlan() == null || plan.getWeekPlan().size() != 7) {
            throw new IllegalArgumentException("A plan must include all seven days of the week.");
        }
        List<String> expectedDays = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
        List<String> actualDays = plan.getWeekPlan().stream().map(WorkoutPlanResponse.DayWorkout::getDay)
                .map(day -> day == null ? "" : day).toList();
        if (!expectedDays.equals(actualDays)) {
            throw new IllegalArgumentException("Plan days must be in Monday-to-Sunday order.");
        }
        long trainingDays = plan.getWeekPlan().stream().filter(day -> !day.isRestDay()).count();
        if (trainingDays != expectedTrainingDays) {
            throw new IllegalArgumentException("The plan does not match the requested number of training days. Please regenerate it.");
        }
        for (WorkoutPlanResponse.DayWorkout day : plan.getWeekPlan()) {
            if (day.getDay() == null || day.getDay().isBlank()) {
                throw new IllegalArgumentException("Each plan day needs a day name.");
            }
            if (!day.isRestDay() && (day.getExercises() == null || day.getExercises().isEmpty())) {
                throw new IllegalArgumentException("Training days need at least one exercise.");
            }
            if (day.getExercises() != null && day.getExercises().stream().anyMatch(exercise ->
                    exercise.getName() == null || exercise.getName().isBlank() || exercise.getSets() < 1 ||
                            exercise.getRepetitions() == null || exercise.getRepetitions().isBlank())) {
                throw new IllegalArgumentException("Exercise names, sets, and repetitions must be complete.");
            }
        }
        if (plan.getPlanName() == null || plan.getPlanName().isBlank()) {
            plan.setPlanName("" + plan.getGoal() + " training plan");
        }
    }

    public String generateWorkoutPlan(UserProfile user){
        String prompt = """
            Create a 7-day workout plan for:
            Goal: %s
            Activity Level: %s
            Weight: %.1f kg

            Include:
            - Exercise name, sets, reps, rest time
            - Warm-up and cool-down
            - Rest days
            - Beginner-friendly modifications
            """.formatted(user.getGoal(), user.getActivityLevel(), user.getWeight());

        String aiReply = chatClient.prompt()
                .system("You are a certified personal trainer.")
                .user(prompt)
                .call()
                .content();

        AiResponse saved= new AiResponse();
        saved.setUserId(user.getId());
        saved.setType("WORKOUT");
        saved.setResponse(aiReply);
        aiResponseRepository.save(saved);

        return aiReply;

    }
}
