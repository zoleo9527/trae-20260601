package com.elevator.smartparking.repository;

import com.elevator.smartparking.entity.Elevator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ElevatorRepository extends JpaRepository<Elevator, Long> {
    Optional<Elevator> findByElevatorNo(String elevatorNo);
}
