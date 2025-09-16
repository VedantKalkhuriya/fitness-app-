package com.example.dailyfitness.Repository;

import com.example.dailyfitness.Entity.userEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface userRepo extends JpaRepository<userEntry,Long> {
}
