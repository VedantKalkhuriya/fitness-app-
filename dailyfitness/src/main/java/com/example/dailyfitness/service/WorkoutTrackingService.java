package com.example.dailyfitness.service;

import com.example.dailyfitness.DTO.WorkoutLogRequest;
import com.example.dailyfitness.DTO.WorkoutSummary;
import com.example.dailyfitness.Entity.ExerciseLog;
import com.example.dailyfitness.Entity.ExerciseSetLog;
import com.example.dailyfitness.Entity.WorkoutLog;
import com.example.dailyfitness.Repository.WorkoutLogRepository;
import com.example.dailyfitness.Repository.userRepo;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public WorkoutLog logWorkout(Long userId, WorkoutLogRequest request) {
        if (request.getSubmissionId() != null && !request.getSubmissionId().isBlank()) {
            var existing = workoutLogRepository.findByUserIdAndSubmissionId(userId, request.getSubmissionId());
            if (existing.isPresent()) return existing.get();
        }

        WorkoutLog log = new WorkoutLog();
        log.setUserId(userId);
        log.setWorkoutType(request.getWorkoutType());
        log.setDurationMinutes(request.getDurationMinutes());
        log.setFeeling(request.getFeeling());
        log.setCaloriesBurned(request.getCaloriesBurned());
        log.setWorkoutDate(request.getWorkoutDate() == null ? LocalDate.now() : request.getWorkoutDate());
        log.setNotes(request.getNotes());
        log.setSubmissionId(request.getSubmissionId());

        List<ExerciseLog> exercises = request.getExercises().stream()
                .map(e -> {
                    ExerciseLog ex = new ExerciseLog();
                    ex.setExerciseName(e.getExerciseName());
                    ex.setNotes(e.getNotes());
                    if (e.getSetDetails() != null && !e.getSetDetails().isEmpty()) {
                        List<ExerciseSetLog> setDetails = e.getSetDetails().stream().map(set -> {
                            ExerciseSetLog detail = new ExerciseSetLog();
                            detail.setSetNumber(set.getSetNumber());
                            detail.setReps(set.getReps());
                            detail.setWeightKg(set.getWeightKg());
                            detail.setCompleted(set.isCompleted());
                            detail.setNotes(set.getNotes());
                            return detail;
                        }).toList();
                        ex.setSetDetails(setDetails);
                        ex.setSets(setDetails.size());
                        var representativeSet = setDetails.stream().filter(ExerciseSetLog::isCompleted)
                                .findFirst().orElse(setDetails.get(0));
                        ex.setReps(representativeSet.getReps());
                        ex.setWeightKg(representativeSet.getWeightKg());
                    } else {
                        ex.setSets(e.getSets());
                        ex.setReps(e.getReps());
                        ex.setWeightKg(e.getWeightKg());
                    }
                    return ex;
                }).toList();

        log.setExercises(exercises);
        log.setAiFeedback("Workout saved. AI feedback is unavailable right now.");
        WorkoutLog saved = workoutLogRepository.save(log);
        try {
            saved.setAiFeedback(getSessionFeedback(saved));
            return workoutLogRepository.save(saved);
        } catch (Exception ignored) {
            // Persisting the workout is the primary operation; a coach outage must not lose it.
            return saved;
        }
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

        // Count distinct consecutive calendar dates. A session today or yesterday
        // keeps the streak active; multiple sessions on one date count once.
        LocalDate checkDate = LocalDate.now();
        LocalDate latest = logs.get(0).getWorkoutDate();
        if (latest == null || latest.isBefore(checkDate.minusDays(1))) return 0;
        if (latest.isBefore(checkDate)) checkDate = checkDate.minusDays(1);

        int streak = 0;
        for (WorkoutLog log : logs) {
            LocalDate date = log.getWorkoutDate();
            if (date == null || date.isAfter(checkDate)) continue;
            if (date.equals(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else if (date.isBefore(checkDate)) {
                break;
            }
        }
        return streak;
    }

    // ✅ Weekly summary stats
    public WorkoutSummary getWeeklySummary(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays((today.getDayOfWeek().getValue() + 6) % 7);
        List<WorkoutLog> weekLogs = workoutLogRepository
                .findByUserIdAndWorkoutDateBetween(
                        userId, weekStart, today
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
            for (ExerciseSetLog set : ex.getSetDetails()) {
                exerciseDetails.append(String.format("  Set %d: %d reps @ %.1f kg (%s)%n",
                        set.getSetNumber(), set.getReps(), set.getWeightKg(),
                        set.isCompleted() ? "completed" : "not completed"));
            }
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
