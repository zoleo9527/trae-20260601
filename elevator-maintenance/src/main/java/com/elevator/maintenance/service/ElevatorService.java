package com.elevator.maintenance.service;

import com.elevator.maintenance.entity.Elevator;
import com.elevator.maintenance.repository.ElevatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ElevatorService {
    @Autowired
    private ElevatorRepository elevatorRepository;

    public List<Elevator> findAll() {
        return elevatorRepository.findAll();
    }

    public Elevator findById(Long id) {
        return elevatorRepository.findById(id).orElse(null);
    }

    public Elevator save(Elevator elevator) {
        return elevatorRepository.save(elevator);
    }

    public void deleteById(Long id) {
        elevatorRepository.deleteById(id);
    }
}
