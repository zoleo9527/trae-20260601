<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon size="48" color="#409eff"><OfficeBuilding /></el-icon>
        <h1>写字楼租赁交付系统</h1>
        <p>交房验收 · 钥匙移交 · 押金结算 · 全程留痕</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          style="width: 100%"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

      <div class="quick-login">
        <p class="quick-title">快速登录（模拟账号）：</p>
        <div class="role-buttons">
          <el-button size="small" type="info" @click="quickLogin('consultant1')">
            <el-icon><User /></el-icon>租赁顾问
          </el-button>
          <el-button size="small" type="success" @click="quickLogin('operations1')">
            <el-icon><Management /></el-icon>运营经理
          </el-button>
          <el-button size="small" type="warning" @click="quickLogin('finance1')">
            <el-icon><Wallet /></el-icon>财务
          </el-button>
        </div>
        <p class="hint">默认密码：pass123</p>
      </div>

      <div class="dispute-warning">
        <el-icon color="#f56c6c"><Warning /></el-icon>
        <span>系统已预置 5 个扯皮场景，登录后在「扯皮预警总览」查看</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.login(form.value.username, form.value.password)
      ElMessage.success(`欢迎回来，${authStore.userName}`)
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    } catch (e) {
    } finally {
      loading.value = false
    }
  })
}

async function quickLogin(username) {
  form.value.username = username
  form.value.password = 'pass123'
  await handleLogin()
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 22px;
  color: #303133;
  margin: 12px 0 6px;
}

.login-header p {
  color: #909399;
  font-size: 13px;
}

.quick-login {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px dashed #ebeef5;
}

.quick-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.role-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.hint {
  font-size: 12px;
  color: #c0c4cc;
}

.dispute-warning {
  margin-top: 20px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.6;
}
</style>
