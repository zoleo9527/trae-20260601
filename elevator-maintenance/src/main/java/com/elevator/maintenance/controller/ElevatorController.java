package com.elevator.maintenance.controller;

import com.elevator.maintenance.common.Result;
import com.elevator.maintenance.entity.Elevator;
import com.elevator.maintenance.service.ElevatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elevators")
public class ElevatorController {
    @Autowired
    private ElevatorService elevatorService;

    @GetMapping
    public Result<List<Elevator>> list() {
        return Result.success(elevatorService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Elevator> getById(@PathVariable Long id) {
        Elevator elevator = elevatorService.findById(id);
        if (elevator != null) {
            return Result.success(elevator);
        }
        return Result.error("电梯不存在");
    }

    @PostMapping
    public Result<Elevator> create(@RequestBody Elevator elevator) {
        return Result.success(elevatorService.save(elevator));
    }

    @PutMapping("/{id}")
    public Result<Elevator> update(@PathVariable Long id, @RequestBody Elevator elevator) {
        elevator.setId(id);
        return Result.success(elevatorService.save(elevator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        elevatorService.deleteById(id);
        return Result.success();
    }
}
