<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#409eff"><Tools /></el-icon>
        <h1 class="login-title">电梯维保管理系统</h1>
        <p class="login-subtitle">Elevator Maintenance Management System</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-button"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
      <div class="demo-accounts">
        <div class="demo-title">演示账号（密码均为 123456）</div>
        <div class="account-list">
          <div class="account-item" v-for="account in demoAccounts" :key="account.username">
            <el-tag :type="account.tagType" size="small" class="account-role">
              {{ account.roleLabel }}
            </el-tag>
            <span class="account-name">{{ account.username }} / {{ account.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Tools } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { USER_ROLE } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const demoAccounts = [
  { username: 'admin', name: '张主管', role: USER_ROLE.SUPERVISOR.value, roleLabel: '项目主管', tagType: 'danger' },
  { username: 'kefu', name: '李客服', role: USER_ROLE.CUSTOMER_SERVICE.value, roleLabel: '客服', tagType: 'primary' },
  { username: 'jishi1', name: '王技师', role: USER_ROLE.TECHNICIAN.value, roleLabel: '维保技师', tagType: 'success' },
  { username: 'jishi2', name: '刘技师', role: USER_ROLE.TECHNICIAN.value, roleLabel: '维保技师', tagType: 'success' }
]

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    if (e !== false) {
      console.error('Login error:', e)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px;
}

.login-subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.demo-accounts {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.demo-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  text-align: center;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
}

.account-role {
  flex-shrink: 0;
}

.account-name {
  color: #606266;
  font-family: monospace;
}
</style>
