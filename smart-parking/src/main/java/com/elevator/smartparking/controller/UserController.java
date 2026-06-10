package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.entity.SysUser;
import com.elevator.smartparking.repository.SysUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "用户管理", description = "系统用户查询（客服、维保技师、项目主管）")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SysUserRepository sysUserRepository;

    @Operation(summary = "查询所有用户", description = "获取系统用户列表")
    @GetMapping
    public Result<List<SysUser>> listAll() {
        return Result.success(sysUserRepository.findAll());
    }
}
