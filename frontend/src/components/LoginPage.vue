<template>
  <div class="login-container">
    <div class="login-form">
      <h2>窗帘门店管理系统</h2>
      <p class="subtitle">客户量尺与报价确认</p>
      <el-form :model="loginForm" ref="loginRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-select v-model="loginForm.username" placeholder="请选择用户">
            <el-option label="导购" value="导购" />
            <el-option label="量尺师" value="量尺师" />
            <el-option label="安装师傅" value="安装师傅" />
            <el-option label="管理员" value="管理员" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login" class="login-btn">登录</el-button>
        </el-form-item>
        <div class="tips">
          <p>提示：所有用户密码均为 123456</p>
          <p>不同角色拥有不同操作权限</p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const emit = defineEmits(['login'])

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRef = ref(null)

const login = async () => {
  if (!loginForm.username || !loginForm.password) {
    return
  }
  
  try {
    const response = await axios.post('/api/login', loginForm)
    emit('login', response.data)
  } catch (error) {
    alert(error.response?.data?.detail || '登录失败')
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

.login-form {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 400px;
}

.login-form h2 {
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.login-form .subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 30px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.tips p {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.tips p:last-child {
  margin-bottom: 0;
}
</style>
