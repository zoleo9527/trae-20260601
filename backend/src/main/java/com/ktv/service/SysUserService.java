package com.ktv.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ktv.entity.SysUser;

public interface SysUserService extends IService<SysUser> {
    SysUser login(String username, String password);
}
