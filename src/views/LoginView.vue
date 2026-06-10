<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { authApi, systemApi } from '../api/resources'
import { ROLE_LABELS } from '../types'
import type { User } from '../types'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const error = ref('')
const loading = ref(false)
const resetting = ref(false)
const demoAccounts = ref<User[]>([])

const roleDescriptions: Record<string, string> = {
  customer_service: '处理预约超量、游客投诉没人回的问题',
  picking_guide: '提交采摘批次、上报采摘损耗、跟进分级入库',
  warehouse: '果品分级、库存更新、入库确认、库存回看',
}

authApi.getDemoAccounts().then(res => {
  demoAccounts.value = res.data
}).catch(() => {})

async function handleLogin() {
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value.trim())
    router.push({ name: 'dashboard' })
  } catch (e: any) {
    error.value = e.response?.data?.detail || '登录失败'
  } finally {
    loading.value = false
  }
}

function quickLogin(name: string) {
  username.value = name
  handleLogin()
}

async function handleResetDemo() {
  if (!confirm('确定重置所有演示数据？将恢复为初始样例数据。')) return
  resetting.value = true
  try {
    await systemApi.resetData()
  } catch {}
  resetting.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>🍑 观光果园</h1>
        <p>果品分级与库存管理系统</p>
      </div>

      <div class="intro-card">
        <div class="intro-title">📖 系统说明</div>
        <ul class="intro-list">
          <li>替代旧台账、现场记录和沟通截图</li>
          <li>解决预约超量、采摘损耗、游客投诉没人回</li>
          <li>三种角色各有不同的处理入口和工作台</li>
        </ul>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="输入演示账号快速登录"
            :disabled="loading"
          />
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
          <button type="button" class="btn btn-outline" @click="handleResetDemo" :disabled="resetting">
            {{ resetting ? '重置中...' : '🔄 重置演示数据' }}
          </button>
        </div>
      </form>

      <div class="demo-section">
        <p class="demo-title">🎯 演示账号（点击快速登录，体验不同角色的工作）</p>
        <div class="demo-accounts">
          <div
            v-for="account in demoAccounts"
            :key="account.username"
            class="demo-account-card"
            @click="quickLogin(account.username)"
          >
            <div class="demo-avatar" :class="'avatar-' + account.role">
              {{ account.display_name[0] }}
            </div>
            <div class="demo-info">
              <div class="demo-name-row">
                <span class="demo-name">{{ account.display_name }}</span>
                <span class="demo-role" :class="'role-text-' + account.role">
                  {{ ROLE_LABELS[account.role] }}
                </span>
              </div>
              <div class="demo-desc">{{ roleDescriptions[account.role] }}</div>
              <div class="demo-username">账号: {{ account.username }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 32px;
  width: 480px;
  max-width: 100vw;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h1 {
  font-size: 26px;
  color: var(--primary);
  margin-bottom: 4px;
}

.login-header p {
  font-size: 13px;
  color: var(--gray-500);
}

.intro-card {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-left: 4px solid var(--warning);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.intro-title {
  font-weight: 700;
  font-size: 14px;
  color: #e65100;
  margin-bottom: 6px;
}

.intro-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.intro-list li {
  font-size: 12px;
  color: var(--gray-700);
  padding: 2px 0;
  padding-left: 16px;
  position: relative;
}

.intro-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: 700;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  flex: 1;
  padding: 12px;
  font-size: 15px;
  justify-content: center;
}

.demo-section {
  border-top: 1px solid var(--gray-200);
  padding-top: 20px;
}

.demo-title {
  font-size: 13px;
  color: var(--gray-600);
  margin-bottom: 12px;
  text-align: center;
  font-weight: 600;
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}

.demo-account-card:hover {
  border-color: var(--primary);
  background: var(--primary-light);
  transform: translateX(4px);
}

.demo-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.avatar-customer_service { background: #1565c0; }
.avatar-picking_guide { background: #e65100; }
.avatar-warehouse { background: #2e7d32; }

.demo-info {
  flex: 1;
  min-width: 0;
}

.demo-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.demo-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
}

.demo-role {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.role-text-customer_service { background: #e3f2fd; color: #1565c0; }
.role-text-picking_guide { background: #fff3e0; color: #e65100; }
.role-text-warehouse { background: #e8f5e9; color: #2e7d32; }

.demo-desc {
  font-size: 12px;
  color: var(--gray-600);
  margin-bottom: 2px;
}

.demo-username {
  font-size: 11px;
  color: var(--gray-400);
  font-family: monospace;
}
</style>
