package com.ktv.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ktv.entity.SysUser;
import com.ktv.mapper.SysUserMapper;
import com.ktv.service.SysUserService;
import org.springframework.stereotype.Service;

@Service
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {
    @Override
    public SysUser login(String username, String password) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username)
                .eq(SysUser::getPassword, password)
                .eq(SysUser::getStatus, 1);
        return getOne(wrapper);
    }
}
