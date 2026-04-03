package com.example.dailyfitness.service;

import com.example.dailyfitness.DTO.WorkoutLogRequest;
import com.example.dailyfitness.DTO.WorkoutSummary;
import com.example.dailyfitness.Entity.ExerciseLog;
import com.example.dailyfitness.Entity.WorkoutLog;
import com.example.dailyfitness.Repository.WorkoutLogRepository;
import com.example.dailyfitness.Repository.userRepo;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class WorkoutTrackingService {

    @Autowired
    private WorkoutLogRepository workoutLogRepository;

    @Autowired
    private userRepo userProfileRepository;

    private final ChatClient chatClient;

    public WorkoutTrackingService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    // ✅ Log a workout
    public WorkoutLog logWorkout(Long userId, WorkoutLogRequest request) {

        WorkoutLog log = new WorkoutLog();
        log.setUserId(userId);
        log.setWorkoutType(request.getWorkoutType());
        log.setDurationMinutes(request.getDurationMinutes());
        log.setFeeling(request.getFeeling());
        log.setCaloriesBurned(request.getCaloriesBurned());

        // Map exercises
        List<ExerciseLog> exercises = request.getExercises().stream()
                .map(e -> {
                    ExerciseLog ex = new ExerciseLog();
                    ex.setExerciseName(e.getExerciseName());
                    ex.setSets(e.getSets());
                    ex.setReps(e.getReps());
                    ex.setWeightKg(e.getWeightKg());
                    ex.setNotes(e.getNotes());
                    return ex;
                }).toList();

        log.setExercises(exercises);

        // Get AI feedback on this session
        String feedback = getSessionFeedback(log);
        log.setAiFeedback(feedback);

        return workoutLogRepository.save(log);
    }

    // ✅ Get all workout history
    public List<WorkoutLog> getHistory(Long userId) {
        return workoutLogRepository
                .findByUserIdOrderByWorkoutDateDesc(userId);
    }

    // ✅ Get history by date range
    public List<WorkoutLog> getHistoryByRange(Long userId,
                                              LocalDate start,
                                              LocalDate end) {
        return workoutLogRepository
                .findByUserIdAndWorkoutDateBetween(userId, start, end);
    }

    // ✅ Calculate streak
    public int getCurrentStreak(Long userId) {
        List<WorkoutLog> logs = workoutLogRepository
                .findByUserIdOrderByWorkoutDateDesc(userId);

        if (logs.isEmpty()) return 0;

        int streak = 0;
        LocalDate checkDate = LocalDate.now();

        for (WorkoutLog log : logs) {
            if (log.getWorkoutDate().equals(checkDate) ||
                    log.getWorkoutDate().equals(checkDate.minusDays(streak))) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    // ✅ Weekly summary stats
    public WorkoutSummary getWeeklySummary(Long userId) {
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        List<WorkoutLog> weekLogs = workoutLogRepository
                .findByUserIdAndWorkoutDateBetween(
                        userId, weekAgo, LocalDate.now()
                );

        int totalWorkouts   = weekLogs.size();
        int totalMinutes    = weekLogs.stream()
                .mapToInt(WorkoutLog::getDurationMinutes).sum();
        int totalCalories   = weekLogs.stream()
                .mapToInt(WorkoutLog::getCaloriesBurned).sum();
        int currentStreak   = getCurrentStreak(userId);
        long totalAllTime   = workoutLogRepository.countByUserId(userId);

        // AI weekly analysis
        String aiAnalysis = getWeeklyAiAnalysis(weekLogs, userId);

        return new WorkoutSummary(totalWorkouts, totalMinutes,
                totalCalories, currentStreak,
                totalAllTime, aiAnalysis);
    }

    // ✅ AI feedback on single session
    private String getSessionFeedback(WorkoutLog log) {

        StringBuilder exerciseDetails = new StringBuilder();
        for (ExerciseLog ex : log.getExercises()) {
            exerciseDetails.append(String.format(
                    "- %s: %d sets x %d reps @ %.1f kg. Notes: %s%n",
                    ex.getExerciseName(), ex.getSets(),
                    ex.getReps(), ex.getWeightKg(), ex.getNotes()
            ));
        }

        String prompt = """
            Analyse this workout session and give brief feedback:

            Workout Type: %s
            Duration: %d minutes
            Feeling: %s
            Calories Burned: %d

            Exercises:
            %s

            Give:
            - 2 lines of positive feedback
            - 1 improvement tip
            - 1 tip for next session
            Keep it short and motivating.
            """.formatted(
                log.getWorkoutType(), log.getDurationMinutes(),
                log.getFeeling(), log.getCaloriesBurned(),
                exerciseDetails.toString()
        );

        return chatClient.prompt()
                .system("You are a motivating personal trainer.")
                .user(prompt)
                .call()
                .content();
    }

    // ✅ AI weekly analysis
    private String getWeeklyAiAnalysis(List<WorkoutLog> logs, Long userId) {

        if (logs.isEmpty()) {
            return "No workouts this week. Start today to build your streak!";
        }

        String logSummary = logs.stream()
                .map(l -> String.format("%s: %s, %d min, %d cal, Feeling: %s",
                        l.getWorkoutDate(), l.getWorkoutType(),
                        l.getDurationMinutes(), l.getCaloriesBurned(), l.getFeeling()))
                .reduce("", (a, b) -> a + "\n" + b);

        String prompt = """
            Analyse this week's workout data and give a summary:

            %s

            Provide:
            - Overall week rating (Excellent/Good/Average/Poor)
            - Key achievement this week
            - What muscle groups were missed
            - Recommendation for next week
            """.formatted(logSummary);

        return chatClient.prompt()
                .system("You are an expert fitness coach.")
                .user(prompt)
                .call()
                .content();
    }


}
