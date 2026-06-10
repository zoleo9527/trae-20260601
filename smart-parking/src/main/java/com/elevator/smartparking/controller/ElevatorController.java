package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.entity.Elevator;
import com.elevator.smartparking.repository.ElevatorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "电梯管理", description = "电梯基础信息查询")
@RestController
@RequestMapping("/api/elevators")
@RequiredArgsConstructor
public class ElevatorController {

    private final ElevatorRepository elevatorRepository;

    @Operation(summary = "查询所有电梯", description = "获取电梯列表")
    @GetMapping
    public Result<List<Elevator>> listAll() {
        return Result.success(elevatorRepository.findAll());
    }

    @Operation(summary = "查询电梯详情", description = "根据ID查询电梯详情")
    @GetMapping("/{id}")
    public Result<Elevator> getById(
            @Parameter(description = "电梯ID") @PathVariable Long id) {
        return Result.success(elevatorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("电梯不存在")));
    }
}
