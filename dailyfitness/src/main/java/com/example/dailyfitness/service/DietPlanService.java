package com.example.dailyfitness.service;

import com.example.dailyfitness.DTO.DietPlanResponse;
import com.example.dailyfitness.Entity.AiResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.AiResponseRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DietPlanService {

    private final ChatClient chatClient;

    @Autowired
    private AiResponseRepository aiResponseRepository;

    public DietPlanService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public DietPlanResponse generateDietPlan(UserProfile user) {

        String prompt = """
            Generate a 7-day diet plan for:
            Name: %s, Age: %d, Weight: %.1fkg
            Goal: %s, Diet preference: %s

            Return a JSON with this structure:
            - summary (string)
            - weekPlan (list of 7 days with day, breakfast,
              lunch, dinner, snack, calories)
            - totalDailyCalories (int)
            - hydrationTip (string)
            """.formatted(
                user.getName(), user.getAge(),
                user.getWeight(), user.getGoal(),
                user.getDietPreference()
        );


        DietPlanResponse result = chatClient.prompt()
                .system("You are a professional nutritionist. Always respond in valid JSON only.")
                .user(prompt)
                .call()
                .entity(DietPlanResponse.class);  // ← magic happens here

        // Save raw JSON to DB
        AiResponse saved = new AiResponse();
        saved.setUserId(user.getId());
        saved.setType("DIET");
        saved.setResponse(result.toString());
        aiResponseRepository.save(saved);

        return result;
    }
}

