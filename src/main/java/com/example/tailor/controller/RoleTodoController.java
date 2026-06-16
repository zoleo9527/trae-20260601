package com.example.tailor.controller;

import com.example.tailor.dto.response.ApiResponse;
import com.example.tailor.dto.response.RoleTodoResponse;
import com.example.tailor.service.RoleTodoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todo")
@Tag(name = "角色待办管理", description = "各角色待办任务查询接口")
public class RoleTodoController {

    private final RoleTodoService roleTodoService;

    public RoleTodoController(RoleTodoService roleTodoService) {
        this.roleTodoService = roleTodoService;
    }

    @GetMapping("/role/{role}")
    @Operation(summary = "获取角色待办任务", description = "根据角色获取对应的试衣反馈和修改记录待办任务")
    public ResponseEntity<ApiResponse<RoleTodoResponse>> getTodoByRole(
            @Parameter(description = "角色类型：MEASURER(量体师)、PATTERN_MAKER(版师)、CUSTOMER_SERVICE(客服)") 
            @PathVariable String role) {
        RoleTodoResponse result = roleTodoService.getTodoByRole(role);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/measurer")
    @Operation(summary = "量体师待办", description = "量体师的待办任务列表")
    public ResponseEntity<ApiResponse<RoleTodoResponse>> getMeasurerTodo() {
        RoleTodoResponse result = roleTodoService.getTodoByRole("MEASURER");
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/pattern-maker")
    @Operation(summary = "版师待办", description = "版师的待办任务列表")
    public ResponseEntity<ApiResponse<RoleTodoResponse>> getPatternMakerTodo() {
        RoleTodoResponse result = roleTodoService.getTodoByRole("PATTERN_MAKER");
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/customer-service")
    @Operation(summary = "客服待办", description = "客服的待办任务列表")
    public ResponseEntity<ApiResponse<RoleTodoResponse>> getCustomerServiceTodo() {
        RoleTodoResponse result = roleTodoService.getTodoByRole("CUSTOMER_SERVICE");
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}