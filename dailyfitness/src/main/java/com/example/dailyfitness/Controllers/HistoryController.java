package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Repository.AiResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/fitness/history")
public class HistoryController {

    @Autowired
    private AiResponseRepository aiResponseRepository;

    // Get full history for a user
    @GetMapping("/{userId}")
    public List<AiResponse> getHistory(@PathVariable Long userId) {
        return aiResponseRepository.findByUserId(userId);
    }

    // Get history by type
    @GetMapping("/{userId}/{type}")
    public List<AiResponse> getByType(@PathVariable Long userId,
                                      @PathVariable String type) {
        return aiResponseRepository.findByUserIdAndType(
                userId, type.toUpperCase()
        );
    }

    // Get latest plan
    @GetMapping("/{userId}/{type}/latest")
    public AiResponse getLatest(@PathVariable Long userId,
                                @PathVariable String type) {
        return aiResponseRepository
                .findTopByUserIdAndTypeOrderByCreatedAtDesc(
                        userId, type.toUpperCase()
                )
                .orElseThrow(() -> new RuntimeException("No history found"));
    }
}