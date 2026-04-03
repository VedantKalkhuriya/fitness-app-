package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.WorkoutLogRequest;
import com.example.dailyfitness.DTO.WorkoutSummary;
import com.example.dailyfitness.Entity.WorkoutLog;
import com.example.dailyfitness.service.WorkoutTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/fitness/workout-tracker")
public class WorkoutTrackingController {

    @Autowired
    private WorkoutTrackingService workoutTrackingService;

    // Log today's workout
    @PostMapping("/log/{userId}")
    public ResponseEntity<WorkoutLog> logWorkout(
            @PathVariable Long userId,
            @RequestBody WorkoutLogRequest request) {
        return ResponseEntity.ok(
                workoutTrackingService.logWorkout(userId, request)
        );
    }

    // Get full history
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<WorkoutLog>> getHistory(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                workoutTrackingService.getHistory(userId)
        );
    }

    // Get history by date range
    @GetMapping("/history/{userId}/range")
    public ResponseEntity<List<WorkoutLog>> getByRange(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        return ResponseEntity.ok(
                workoutTrackingService.getHistoryByRange(
                        userId,
                        LocalDate.parse(start),
                        LocalDate.parse(end)
                )
        );
    }

    // Get streak
    @GetMapping("/streak/{userId}")
    public ResponseEntity<Integer> getStreak(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                workoutTrackingService.getCurrentStreak(userId)
        );
    }

    // Get weekly summary + AI analysis
    @GetMapping("/summary/{userId}")
    public ResponseEntity<WorkoutSummary> getSummary(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                workoutTrackingService.getWeeklySummary(userId)
        );
    }
}