package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.WorkoutLogRequest;
import com.example.dailyfitness.DTO.WorkoutSummary;
import com.example.dailyfitness.Entity.WorkoutLog;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.userRepo;
import com.example.dailyfitness.service.WorkoutTrackingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/fitness/workout-tracker")
public class WorkoutTrackingController {

    @Autowired
    private WorkoutTrackingService workoutTrackingService;

    @Autowired
    private userRepo users;

    // Log today's workout
    @PostMapping("/log/{userId}")
    public ResponseEntity<WorkoutLog> logWorkout(
            @PathVariable Long userId,
            @Valid @RequestBody WorkoutLogRequest request,
            Authentication authentication) {
        requireOwner(userId, authentication);
        if (request.getWorkoutDate() != null && request.getWorkoutDate().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workout date cannot be in the future.");
        }
        boolean hasSetRows = request.getExercises().stream().anyMatch(exercise ->
                exercise.getSetDetails() != null && !exercise.getSetDetails().isEmpty());
        if (hasSetRows && request.getExercises().stream()
                .flatMap(exercise -> exercise.getSetDetails() == null ? java.util.stream.Stream.empty() : exercise.getSetDetails().stream())
                .noneMatch(WorkoutLogRequest.SetRequest::isCompleted)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mark at least one set as completed before saving.");
        }
        return ResponseEntity.ok(
                workoutTrackingService.logWorkout(userId, request)
        );
    }

    // Get full history
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<WorkoutLog>> getHistory(
            @PathVariable Long userId, Authentication authentication) {
        requireOwner(userId, authentication);
        return ResponseEntity.ok(
                workoutTrackingService.getHistory(userId)
        );
    }

    // Get history by date range
    @GetMapping("/history/{userId}/range")
    public ResponseEntity<List<WorkoutLog>> getByRange(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end,
            Authentication authentication) {
        requireOwner(userId, authentication);
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date must be on or before end date.");
        }
        return ResponseEntity.ok(
                workoutTrackingService.getHistoryByRange(
                        userId,
                        startDate,
                        endDate
                )
        );
    }

    // Get streak
    @GetMapping("/streak/{userId}")
    public ResponseEntity<Integer> getStreak(
            @PathVariable Long userId, Authentication authentication) {
        requireOwner(userId, authentication);
        return ResponseEntity.ok(
                workoutTrackingService.getCurrentStreak(userId)
        );
    }

    // Get weekly summary + AI analysis
    @GetMapping("/summary/{userId}")
    public ResponseEntity<WorkoutSummary> getSummary(
            @PathVariable Long userId, Authentication authentication) {
        requireOwner(userId, authentication);
        return ResponseEntity.ok(
                workoutTrackingService.getWeeklySummary(userId)
        );
    }

    private UserProfile requireOwner(Long userId, Authentication authentication) {
        UserProfile user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (authentication == null || !user.getName().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own workout data.");
        }
        return user;
    }
}
