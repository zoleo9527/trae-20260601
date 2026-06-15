<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>电脑装机店返修记录与质保跟踪系统</h2>
        <p>请登录系统</p>
      </div>
      
      <el-form ref="loginForm" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin">登录</el-button>
        </el-form-item>
        
        <div class="user-info">
          <p>测试账号：</p>
          <p>管理员：admin / admin123</p>
          <p>销售：sales / sales123</p>
          <p>装机师：technician / tech123</p>
          <p>客服：service / service123</p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '@/utils/axios'

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    const response = await axios.post('/login', form)
    localStorage.setItem('user', JSON.stringify(response.data))
    ElMessage.success('登录成功')
    window.location.href = '/'
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '登录失败')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  font-size: 20px;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.user-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}

.user-info p:first-child {
  font-weight: bold;
  margin-bottom: 8px;
}
</style>