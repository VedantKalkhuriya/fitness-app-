package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {


    private final ChatClient chatClient;

    @Autowired
    private AiResponseRepository aiResponseRepository;

    public FeedbackService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String getFeedback(UserProfile user, String progressLog) {

        String prompt = """
            Analyse the following fitness progress and give feedback:

            User Goal: %s
            Current Weight: %.1f kg

            Progress Log:
            %s

            Provide:
            - What they are doing well
            - What needs improvement
            - Adjusted tips for next week
            """.formatted(user.getGoal(), user.getWeight(), progressLog);

         String aiReply = chatClient.prompt()
                .system("You are an encouraging and expert fitness coach.")
                .user(prompt)
                .call()
                .content();
        AiResponse saved= new AiResponse();
        saved.setUserId(user.getId());
        saved.setType("FEEDBACK");
        saved.setResponse(aiReply);
        aiResponseRepository.save(saved);

        return aiReply;
    }
}
