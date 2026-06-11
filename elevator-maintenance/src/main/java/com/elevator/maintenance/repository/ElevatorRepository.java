package com.elevator.maintenance.repository;

import com.elevator.maintenance.entity.Elevator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ElevatorRepository extends JpaRepository<Elevator, Long> {
}
