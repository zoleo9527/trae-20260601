<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const quickLogins = [
  { username: 'doctor_li', password: '123456', label: '李明华（全科医生）' },
  { username: 'doctor_zhao', password: '123456', label: '赵红梅（全科医生）' },
  { username: 'nurse_zhou', password: '123456', label: '周小燕（护士）' },
  { username: 'nurse_wu', password: '123456', label: '吴丽萍（护士）' },
  { username: 'ph_chen', password: '123456', label: '陈国强（公共卫生专员）' },
]

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await api.login(username.value, password.value)
    localStorage.setItem('auth', JSON.stringify(res))
    router.push('/')
  } catch (e) {
    error.value = e?.error?.message || '登录失败'
  } finally {
    loading.value = false
  }
}

function quickLogin(user) {
  username.value = user.username
  password.value = user.password
  handleLogin()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>社区卫生站</h1>
        <p>疫苗预约与留观记录系统</p>
      </div>

      <div class="login-form">
        <div class="form-item">
          <label>用户名</label>
          <input v-model="username" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button class="btn-login" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </div>

      <div class="quick-login">
        <p class="quick-title">快速登录（测试账号）</p>
        <div class="quick-buttons">
          <button
            v-for="u in quickLogins"
            :key="u.username"
            class="quick-btn"
            @click="quickLogin(u)"
          >
            {{ u.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2332 0%, #2d3a4a 100%);
}

.login-card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #1a2332;
}

.login-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.form-item input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-item input:focus {
  border-color: #409eff;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-login {
  width: 100%;
  padding: 10px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-login:hover {
  background: #66b1ff;
}

.btn-login:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.quick-login {
  margin-top: 24px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.quick-title {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  padding: 4px 10px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s;
}

.quick-btn:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}
</style>
