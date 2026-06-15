<template>
  <div class="login-container">
    <div class="login-form">
      <h2>卫浴安装管理系统</h2>
      <p class="subtitle">漏水返工与责任判定</p>
      
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
        </el-form-item>
      </el-form>
      
      <div class="role-tips">
        <p>快速登录：</p>
        <div class="role-buttons">
          <el-button @click="selectRole('dispatcher001')" size="small">调度员</el-button>
          <el-button @click="selectRole('technician001')" size="small">李师傅</el-button>
          <el-button @click="selectRole('technician002')" size="small">王师傅</el-button>
          <el-button @click="selectRole('service001')" size="small">售后客服</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { login } from '../utils/api'

const formRef = ref(null)
const form = reactive({
  username: '',
  password: '123456'
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.error('请输入用户名和密码')
    return
  }
  
  try {
    const response = await login(form.username, form.password)
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user))
      ElMessage.success('登录成功')
      redirectToDashboard(response.user.role)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '登录失败')
  }
}

const selectRole = (username) => {
  form.username = username
  form.password = '123456'
  handleLogin()
}

const redirectToDashboard = (role) => {
  switch (role) {
    case 'dispatcher':
      window.location.href = '/dispatcher'
      break
    case 'technician':
      window.location.href = '/technician'
      break
    case 'customer_service':
      window.location.href = '/service'
      break
    default:
      window.location.href = '/dispatcher'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 400px;
}

.login-form h2 {
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
}

.login-btn {
  width: 100%;
}

.role-tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.role-tips p {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.role-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>