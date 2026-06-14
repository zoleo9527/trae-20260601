<template>
  <div class="login-container">
    <div class="login-card">
      <h2>彩票门店-兑奖登记与资料留存系统</h2>
      <div class="demo-accounts">
        <p>演示账号：</p>
        <div class="account-list">
          <div class="account-item">
            <span class="account-label">店员：</span>
            <span class="account-value">clerk / 123456</span>
          </div>
          <div class="account-item">
            <span class="account-label">店长：</span>
            <span class="account-value">manager / 123456</span>
          </div>
          <div class="account-item">
            <span class="account-label">片区管理员：</span>
            <span class="account-value">admin / 123456</span>
          </div>
        </div>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </div>
        <button type="submit" class="btn btn-primary btn-block">登录</button>
      </form>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/types'

const username = ref('')
const password = ref('')
const errorMessage = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.value, password: password.value })
  })
  
  const result = await response.json()
  
  if (result.success) {
    const user: User = result.data
    localStorage.setItem('user', JSON.stringify(user))
    window.location.href = '/dashboard'
  } else {
    errorMessage.value = result.message
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-card h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.demo-accounts {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.demo-accounts p {
  margin: 0 0 12px 0;
  font-weight: 500;
  color: #666;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.account-label {
  color: #888;
}

.account-value {
  color: #4080ff;
  font-family: monospace;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #4080ff;
}

.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

.error-message {
  margin-top: 16px;
  text-align: center;
  color: #ff4d4f;
  font-size: 14px;
}
</style>
