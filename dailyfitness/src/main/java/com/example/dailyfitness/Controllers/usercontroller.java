package com.example.dailyfitness.Controllers;

import com.example.dailyfitness.DTO.AuthResponse;
import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.JWT.JwtUtil;
import com.example.dailyfitness.service.userservice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")

@Slf4j
public class usercontroller  {




    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserDetailsService userDetailsService;


    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private userservice userservice;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<UserProfile> getUser() {
        return userservice.getuser();
    }


    @PostMapping("/login/user")
    public ResponseEntity<?> login(@RequestBody UserProfile user) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getName(), user.getPassword()
                    )
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getName());
            String jwt = jwtUtil.generateToken(userDetails);

            // ✅ Fetch the full user to get id and name
            UserProfile fullUser = userservice.findByName(user.getName());

            // ✅ Return token + userId + name (frontend needs all 3)
            AuthResponse response = new AuthResponse(jwt, fullUser.getId(), fullUser.getName());
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Exception occurred while createAuthenticationToken ", e);
            return new ResponseEntity<>("Incorrect username or password", HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/signup/user")
    public ResponseEntity<?> adduser(@RequestBody UserProfile user) {
        boolean saved = userservice.saveNewUser(user);

        if (!saved) {
            return new ResponseEntity<>(
                    "User signup failed. Ensure username/password are provided and username is unique.",
                    HttpStatus.BAD_REQUEST
            );
        }

        // ✅ Auto-login after signup — generate token immediately
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getName());
        String jwt = jwtUtil.generateToken(userDetails);
        UserProfile fullUser = userservice.findByName(user.getName());

        AuthResponse response = new AuthResponse(jwt, fullUser.getId(), fullUser.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }



}

