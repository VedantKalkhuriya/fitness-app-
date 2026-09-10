package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.UserProfile;
import com.example.dailyfitness.Repository.userRepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class userservice {
    @Autowired
    private userRepo userrepo;

    @Autowired  // Remove 'static' keyword - this is the fix!
    private PasswordEncoder passwordEncoder;

    public boolean saveNewUser(UserProfile user) {
        try {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRoles("USER");
            userrepo.save(user);
            return true;
        } catch (Exception e) {
            log.error("Error saving user: ", e);  // Better logging
            return false;
        }
    }


    public List<UserProfile> getuser() {
        return userrepo.findAll();

    }

    public Optional<UserProfile> findByNameOptional(String name) {
        return userrepo.findByName(name);
    }
    public UserProfile findByName(String name) {
        return userrepo.findByname(name); //
    }



    public Optional<UserProfile> getuserbyid(Long id) {
        return userrepo.findById(id);
    }
    public void deleteuserbyid(Long id) {
        userrepo.deleteById(id);
    }
}