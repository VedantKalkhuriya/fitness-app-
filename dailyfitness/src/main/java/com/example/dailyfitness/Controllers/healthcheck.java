package com.example.dailyfitness.Controllers;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/healthcheck")
public class healthcheck{

    @GetMapping
    public String healthcheck(){
        return "Service is up and running! ✅";
    }
}
