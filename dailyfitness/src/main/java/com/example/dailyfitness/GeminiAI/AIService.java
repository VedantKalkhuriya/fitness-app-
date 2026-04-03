package com.example.dailyfitness.GeminiAI;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.stereotype.Service;

@Service
public class AIService {

    private final ChatClient chatClient;
    ChatMemory chatMemory = new InMemoryChatMemory();

    // Spring Boot automatically provides a ChatClient.Builder
    public AIService(ChatClient.Builder builder) {

        this.chatClient = builder
                .defaultSystem("You are a specialized Fitness Coach . " +
                        "Always provide best advice.")
                .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
                .build();    }

    public String generateText(String prompt) {
        return chatClient.prompt()
                .user(prompt)
                .call()
                .content(); // Simple and fluent!
    }
}