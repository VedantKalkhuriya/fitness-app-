package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Entity.WorkoutLog;
import com.example.dailyfitness.Entity.SavedWorkoutPlan;
import com.example.dailyfitness.DTO.WorkoutPlanResponse;
import com.example.dailyfitness.DTO.DietPlanResponse;
import com.example.dailyfitness.Repository.AiResponseRepository;
import com.example.dailyfitness.Repository.WorkoutLogRepository;
import com.example.dailyfitness.Repository.SavedWorkoutPlanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FeedbackService {


    private final ChatClient chatClient;

    @Autowired
    private AiResponseRepository aiResponseRepository;
    @Autowired
    private WorkoutLogRepository workoutLogRepository;
    @Autowired
    private SavedWorkoutPlanRepository workoutPlanRepository;
    @Autowired
    private ObjectMapper objectMapper;

    public FeedbackService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String getFeedback(UserProfile user, String coachingPrompt) {
        String requestText = coachingPrompt.toLowerCase();
        boolean nutritionRequest = requestText.contains("meal") || requestText.contains("diet") ||
                requestText.contains("nutrition") || requestText.contains("food");
        String workoutContext = "";
        String planContext = "";
        String dietContext = nutritionRequest ? summarizeDietPlan(user.getId()) : "Not included; request is not nutrition-related.";
        if (!nutritionRequest) {
            LocalDate today = LocalDate.now();
            LocalDate twoWeeksAgo = today.minusDays(13);
            List<WorkoutLog> recentWorkouts = workoutLogRepository
                    .findByUserIdAndWorkoutDateBetween(user.getId(), twoWeeksAgo, today);
            workoutContext = recentWorkouts.isEmpty()
                    ? "No completed workout records were found in the last 14 days."
                    : recentWorkouts.stream().map(this::summarizeWorkout).reduce((a, b) -> a + "\n" + b).orElse("");
            SavedWorkoutPlan activePlan = workoutPlanRepository
                    .findFirstByUserIdAndActiveTrue(user.getId()).orElse(null);
            planContext = summarizePlan(activePlan);
        }
        String profileContext = nutritionRequest
                ? "Diet preference: " + blankAsUnknown(user.getDietPreference())
                : "Fitness goal: " + blankAsUnknown(user.getGoal()) + "\nActivity level: " + blankAsUnknown(user.getActivityLevel());
        String prompt = """
            Coaching request:
            %s

            Relevant verified profile context:
            %s

            Verified completed workout records from the last 14 calendar days (when relevant):
            %s

            Active saved workout plan (when relevant):
            %s

            Latest saved meal plan (only for nutrition-related requests):
            %s

            Use only the verified facts above and the user's request. State when the records are insufficient to assess something. Do not infer weight change, adherence, sleep, or progress that is not recorded. Give practical, conservative fitness guidance. Do not diagnose injuries or medical conditions, prescribe treatment, or promise outcomes.

            Format your response with only the sections that are useful and supported, using these optional headings exactly:
            Overall Summary
            What Is Going Well
            Areas to Improve
            Recommended Next Steps
            Keep each section concise and tie observations to the available records.
            """.formatted(
                coachingPrompt,
                profileContext,
                workoutContext,
                planContext,
                dietContext
        );

        String aiReply = chatClient.prompt()
                .system("You are an evidence-led, supportive fitness coach. Never claim to be a clinician. Distinguish observed facts from interpretations and acknowledge missing data.")
                .user(prompt)
                .call()
                .content();
        if (aiReply == null || aiReply.isBlank()) {
            throw new IllegalStateException("The coaching service returned an empty response.");
        }
        AiResponse saved= new AiResponse();
        saved.setUserId(user.getId());
        saved.setType("FEEDBACK");
        saved.setResponse(aiReply);
        aiResponseRepository.save(saved);

        return aiReply;
    }

    private String summarizeDietPlan(Long userId) {
        AiResponse saved = aiResponseRepository.findTopByUserIdAndTypeOrderByCreatedAtDesc(userId, "DIET").orElse(null);
        if (saved == null) return "No saved structured meal plan is available.";
        try {
            DietPlanResponse plan = objectMapper.readValue(saved.getResponse(), DietPlanResponse.class);
            String meals = plan.getWeekPlan() == null ? "" : plan.getWeekPlan().stream()
                    .flatMap(day -> day.getMeals() == null ? java.util.stream.Stream.empty() : day.getMeals().stream())
                    .limit(16).map(meal -> meal.getMealType() + ": " + meal.getName())
                    .reduce((a, b) -> a + "; " + b).orElse("");
            return "Saved plan summary: " + blankAsUnknown(plan.getSummary()) +
                    (meals.isBlank() ? "" : "; sample meals: " + meals);
        } catch (Exception ignored) {
            return "A saved plan exists, but its older format does not include readable structured meal details.";
        }
    }

    private String summarizeWorkout(WorkoutLog workout) {
        String exercises = workout.getExercises() == null ? "" : workout.getExercises().stream()
                .map(exercise -> {
                    int completedSets = exercise.getSetDetails() == null ? 0 :
                            (int) exercise.getSetDetails().stream().filter(set -> set.isCompleted()).count();
                    return exercise.getExerciseName() + (completedSets > 0 ? " (" + completedSets + " sets completed)" : "");
                }).reduce((a, b) -> a + ", " + b).orElse("");
        return "%s — %s, %d minutes%s".formatted(
                workout.getWorkoutDate(), blankAsUnknown(workout.getWorkoutType()), workout.getDurationMinutes(),
                exercises.isBlank() ? "" : ", exercises: " + exercises
        );
    }

    private String summarizePlan(SavedWorkoutPlan saved) {
        if (saved == null) return "No active saved workout plan.";
        try {
            WorkoutPlanResponse plan = objectMapper.readValue(saved.getPlanJson(), WorkoutPlanResponse.class);
            String schedule = plan.getWeekPlan() == null ? "" : plan.getWeekPlan().stream()
                    .map(day -> {
                        if (day.isRestDay()) return day.getDay() + " (rest)";
                        String exercises = day.getExercises() == null ? "" : day.getExercises().stream()
                                .limit(6).map(WorkoutPlanResponse.DayWorkout.Exercise::getName)
                                .reduce((a, b) -> a + ", " + b).orElse("");
                        return day.getDay() + ": " + blankAsUnknown(day.getFocus()) +
                                (exercises.isBlank() ? "" : " [" + exercises + "]");
                    })
                    .reduce((a, b) -> a + "; " + b).orElse("");
            return "%s; goal: %s; %d days/week; %d min/session; schedule: %s".formatted(
                    saved.getPlanName(), saved.getGoal(), saved.getTrainingDaysPerWeek(),
                    saved.getEstimatedSessionMinutes(), schedule);
        } catch (Exception ignored) {
            return "%s; goal: %s; %d days/week; %d min/session".formatted(
                    saved.getPlanName(), saved.getGoal(), saved.getTrainingDaysPerWeek(), saved.getEstimatedSessionMinutes());
        }
    }

    private String blankAsUnknown(String value) {
        return value == null || value.isBlank() ? "Not provided" : value;
    }
}
