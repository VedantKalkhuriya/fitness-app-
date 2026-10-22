package com.example.dailyfitness.service;

import com.example.dailyfitness.DTO.DietPlanGenerationRequest;
import com.example.dailyfitness.DTO.DietPlanResponse;
import com.example.dailyfitness.DTO.MealSubstitutionRequest;
import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class DietPlanService {
    private final ChatClient chatClient;
    private final AiResponseRepository aiResponseRepository;
    private final ObjectMapper objectMapper;

    public DietPlanService(ChatClient.Builder builder, AiResponseRepository aiResponseRepository,
                           ObjectMapper objectMapper) {
        this.chatClient = builder.build();
        this.aiResponseRepository = aiResponseRepository;
        this.objectMapper = objectMapper;
    }

    public AiResponse generateDietPlan(UserProfile user, DietPlanGenerationRequest request) {
        String goal = blankAs(request.getFitnessGoal(), user.getGoal());
        String prompt = """
            Create a practical 7-day meal plan with %d meals per day.

            Fitness goal: %s
            Dietary preference: %s
            Food restrictions, allergies, or dislikes (treat as strict constraints): %s
            Budget guidance: %s
            Ingredients already available: %s

            Return structured JSON matching the provided schema exactly. Each day must have a day name, a meals array containing exactly %d entries with mealType, name, ingredients, instructions, and optional per-meal calorie and macro estimates. Each ingredient should have a name and, when known, a numeric quantity and unit. Include day-level calories and macros only when you can provide a reasonable estimate; use null when data is insufficient. Include plan-level daily calories and macros only as estimates when supported. Do not invent precision, medical nutrition targets, or disease-specific advice. Respect the selected dietary preference and all restrictions in every meal. Keep ingredients accessible and use budget and available ingredients where possible.

            A meal's nutritional values are approximate and depend on ingredient quantities and preparation.
            """.formatted(
                request.getMealsPerDay(), goal, request.getDietaryPreference(),
                blankAs(request.getRestrictions(), "None provided"),
                blankAs(request.getBudget(), "No budget guidance provided"),
                blankAs(request.getAvailableIngredients(), "No ingredients specified"),
                request.getMealsPerDay()
        );

        DietPlanResponse plan = chatClient.prompt()
                .system("You create practical general meal ideas, not medical nutrition advice. Follow dietary restrictions strictly. Return only valid JSON conforming to the response schema. Omit unsupported nutrition estimates rather than guessing.")
                .user(prompt)
                .call()
                .entity(DietPlanResponse.class);
        validatePlan(plan);

        AiResponse saved = new AiResponse();
        saved.setUserId(user.getId());
        saved.setType("DIET");
        saved.setResponse(writeJson(plan));
        return aiResponseRepository.save(saved);
    }

    public DietPlanResponse.Meal substituteMeal(UserProfile user, MealSubstitutionRequest request) {
        String current;
        try {
            current = objectMapper.writeValueAsString(request.getCurrentMeal());
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("The selected meal could not be read.", exception);
        }
        String target = request.getIngredientToReplace();
        String instruction = target == null || target.isBlank()
                ? "Suggest a different meal in the same meal slot, rather than renaming the current one."
                : "Replace only the ingredient named '" + target + "' with a suitable alternative and keep the rest of this meal as consistent as possible.";
        String prompt = """
            Provide one structured meal replacement.
            Meal slot: %s
            Current meal: %s
            Dietary preference: %s
            Strict restrictions and allergies: %s
            Fitness goal: %s
            Task: %s

            Return one JSON meal with mealType, name, ingredients (name and optional numeric quantity/unit), preparation instructions, and optional nutrition estimates. Preserve the meal slot. Respect every restriction. Do not provide medical nutrition advice; omit any nutrition value that cannot be estimated from quantities.
            """.formatted(
                request.getMealType(), current, request.getDietaryPreference(),
                blankAs(request.getRestrictions(), "None provided"),
                blankAs(user.getGoal(), "Not set"), instruction
        );
        DietPlanResponse.Meal replacement = chatClient.prompt()
                .system("You suggest safe, general meal substitutions and strictly honor the stated dietary preference and restrictions. Return only valid JSON matching the meal schema.")
                .user(prompt)
                .call()
                .entity(DietPlanResponse.Meal.class);
        if (replacement == null || replacement.getName() == null || replacement.getName().isBlank() ||
                replacement.getMealType() == null || replacement.getMealType().isBlank()) {
            throw new IllegalStateException("The meal substitution response was incomplete. Please retry.");
        }
        replacement.setMealType(request.getMealType());
        return replacement;
    }

    public void validatePlan(DietPlanResponse plan) {
        if (plan == null || plan.getSummary() == null || plan.getSummary().isBlank() ||
                plan.getWeekPlan() == null || plan.getWeekPlan().size() != 7) {
            throw new IllegalArgumentException("A meal plan must include a summary and all seven days.");
        }
        Set<String> days = new HashSet<>();
        for (DietPlanResponse.DayMeal day : plan.getWeekPlan()) {
            if (day == null || day.getDay() == null || day.getDay().isBlank() ||
                    !days.add(day.getDay().toLowerCase(Locale.ROOT)) || day.getMeals() == null ||
                    day.getMeals().size() < 3 || day.getMeals().size() > 6) {
                throw new IllegalArgumentException("Each day must have a unique name and three to six structured meals.");
            }
            for (DietPlanResponse.Meal meal : day.getMeals()) {
                if (meal == null || meal.getMealType() == null || meal.getMealType().isBlank() ||
                        meal.getName() == null || meal.getName().isBlank()) {
                    throw new IllegalArgumentException("Every meal needs a type and a name.");
                }
            }
        }
    }

    private String writeJson(DietPlanResponse plan) {
        try {
            return objectMapper.writeValueAsString(plan);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("The meal plan could not be saved.", exception);
        }
    }

    private String blankAs(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
