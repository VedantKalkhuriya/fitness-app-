package com.example.dailyfitness.service;


import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WorkoutPlanService {
    private final ChatClient chatClient;

    @Autowired
    private AiResponseRepository aiResponseRepository;

    public WorkoutPlanService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
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
