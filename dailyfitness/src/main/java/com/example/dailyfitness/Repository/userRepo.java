package com.example.dailyfitness.Repository;

import com.example.dailyfitness.Entity.UserProfile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository

public interface userRepo extends JpaRepository<UserProfile,Long> {


    Optional<UserProfile> findByName(String name) ;

    UserProfile findByname(String name);
}

