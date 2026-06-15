package com.example.tilestore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.tilestore.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    SysUser findByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_user WHERE role = #{role} AND status = 1")
    List<SysUser> findByRole(@Param("role") String role);
}