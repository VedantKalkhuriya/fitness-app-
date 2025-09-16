package com.example.dailyfitness.usercontroller;

import com.example.dailyfitness.Entity.userEntry;
import com.example.dailyfitness.service.userservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class usercontroller  {


    @Autowired
    private userservice userservice;

    @GetMapping
    public List<userEntry> getUser() {
        return userservice.getuser();
    }
    @PutMapping
    public ResponseEntity<String> adduser(@RequestBody userEntry user) { // Changed return type for REST best practice
        userservice.saveuser(user);
        // For a POST request that creates a resource, returning 201 Created is standard.
        return new ResponseEntity<>("User added successfully", HttpStatus.CREATED);
    }

}

//  try and catch exception dal shakte hu mai yaha pe ,
// kn why and where to use try and catch exceptipon
// make a front ent for it ;;
