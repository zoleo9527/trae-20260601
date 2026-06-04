<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="40" color="#409EFF"><Hospital /></el-icon>
        </div>
        <h1 class="title">眼科手术中心</h1>
        <p class="subtitle">术后用药与复诊提醒系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-select v-model="form.username" placeholder="请选择角色" size="large">
            <el-option label="手术护士 - 张护士" value="nurse">
              <div class="option-content">
                <el-icon><UserFilled /></el-icon>
                <span>手术护士 - 张护士</span>
              </div>
            </el-option>
            <el-option label="主刀医生 - 李医生" value="surgeon">
              <div class="option-content">
                <el-icon><UserFilled /></el-icon>
                <span>主刀医生 - 李医生</span>
              </div>
            </el-option>
            <el-option label="随访专员 - 王专员" value="specialist">
              <div class="option-content">
                <el-icon><UserFilled /></el-icon>
                <span>随访专员 - 王专员</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码 (默认: 123456)"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录系统
        </el-button>
      </el-form>

      <div class="login-tips">
        <el-icon color="#909399"><InfoFilled /></el-icon>
        <span>测试账号密码均为 123456</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/store/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '123456'
})

const rules: FormRules = {
  username: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const success = await authStore.login(form.username, form.password)
    if (success) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error('登录失败，请检查账号密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
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
  margin-bottom: 30px;
}

.logo {
  width: 70px;
  height: 70px;
  margin: 0 auto 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo :deep(svg) {
  color: #fff;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
