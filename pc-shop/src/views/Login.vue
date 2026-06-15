<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">🖥️</div>
        <h1 class="login-title">电脑装机店管理系统</h1>
        <p class="login-subtitle">配件到货 · 装机排程 · 异常追踪</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-row">
          <label class="form-label">账号</label>
          <div class="form-input">
            <input v-model="username" type="text" placeholder="请输入账号" required />
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">密码</label>
          <div class="form-input">
            <input v-model="password" type="password" placeholder="请输入密码" required />
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width:100%;padding:10px;margin-top:8px">
          登录系统
        </button>
        
        <p v-if="loginError" class="text-danger text-sm mt-8 text-center">{{ loginError }}</p>
      </form>
      
      <div class="divider"></div>
      
      <div class="role-entries">
        <h4 class="text-sm text-muted mb-12">快速角色切换入口（原型演示）</h4>
        <div class="role-grid">
          <button v-for="u in roleUsers" :key="u.role" class="role-card" @click="quickLogin(u)">
            <div class="role-avatar" :class="'avatar-'+u.role">{{ u.avatar }}</div>
            <div>
              <div class="role-name font-semibold">{{ u.name }}</div>
              <div class="text-xs text-muted">{{ u.roleName }}</div>
              <div class="text-xs text-muted mt-4">账号: {{ u.username }} / 123456</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loginError = ref('')

const roleUsers = auth.users.map(u => u)

function handleLogin() {
  loginError.value = ''
  if (auth.login(username.value, password.value)) {
    router.push('/dashboard')
  } else {
    loginError.value = '账号或密码错误'
  }
}

function quickLogin(u) {
  auth.login(u.username, u.password)
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 36px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.login-subtitle {
  color: #6b7280;
  margin-top: 6px;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  text-align: left;
  transition: all 0.15s;
  background: #fafafa;
}

.role-card:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.role-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.avatar-manager { background: #2563eb; }
.avatar-sales { background: #0891b2; }
.avatar-warehouse { background: #16a34a; }
.avatar-tech { background: #7c3aed; }
.avatar-service { background: #d97706; }

.role-name {
  font-size: 14px;
}

.mt-4 { margin-top: 4px; }
.mb-12 { margin-bottom: 12px; }
</style>
