package com.example.dailyfitness.service;

import com.example.dailyfitness.Entity.userEntry;
import com.example.dailyfitness.Repository.userRepo;
import com.example.dailyfitness.Repository.workoutrepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class userservice {
    @Autowired
    private userRepo userrepo;


    public void saveuser(userEntry user ) {
        userrepo.save(user);

    }
    public List<userEntry> getuser() {
        return userrepo.findAll();

    }

    public Optional<userEntry> getuserbyid(Long id) {
        return userrepo.findById(id);
    }
    public void deleteuserbyid(Long id) {
        userrepo.deleteById(id);
    }
}

