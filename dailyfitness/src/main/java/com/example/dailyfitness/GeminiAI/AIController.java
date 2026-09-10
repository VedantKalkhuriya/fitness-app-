package com.example.dailyfitness.GeminiAI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/generate")
    public String generateText(@RequestBody String prompt) {
        return aiService.generateText(prompt);
    }

}