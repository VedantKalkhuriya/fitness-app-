package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.userRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private userRepo userRepo;
    

    @Override
    public UserDetails loadUserByUsername(String name)
            throws UsernameNotFoundException {

        // 1️⃣ Try normal user
        
        Optional<UserProfile> userOptional = userRepo.findByName(name);

        if (userOptional.isPresent()) {
            UserProfile user = userOptional.get();

            String roles = (user.getRoles() != null && !user.getRoles().isEmpty())
                    ? user.getRoles()
                    : "USER";

            return User.builder()
                    .username(user.getName())
                    .password(user.getPassword())
                    .roles(roles)
                    .build();
        }
        

        // 3️⃣ If nothing found
        throw new UsernameNotFoundException(
                "No user or trainer found with username: " + name
        );
    }



}
