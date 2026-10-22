package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import com.example.dailyfitness.Repository.userRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
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
    @Autowired
    private userRepo users;

    // Get full history for a user
    @GetMapping("/{userId}")
    public List<AiResponse> getHistory(@PathVariable Long userId, Authentication authentication) {
        requireOwner(userId, authentication);
        return aiResponseRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get history by type
    @GetMapping("/{userId}/{type}")
    public List<AiResponse> getByType(@PathVariable Long userId,
                                      @PathVariable String type,
                                      Authentication authentication) {
        requireOwner(userId, authentication);
        return aiResponseRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type.toUpperCase());
    }

    // Get latest plan
    @GetMapping("/{userId}/{type}/latest")
    public AiResponse getLatest(@PathVariable Long userId,
                                @PathVariable String type,
                                Authentication authentication) {
        requireOwner(userId, authentication);
        return aiResponseRepository
                .findTopByUserIdAndTypeOrderByCreatedAtDesc(
                        userId, type.toUpperCase()
                )
                .orElseThrow(() -> new RuntimeException("No history found"));
    }

    private UserProfile requireOwner(Long userId, Authentication authentication) {
        UserProfile user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (authentication == null || !user.getName().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own AI response history.");
        }
        return user;
    }
}
