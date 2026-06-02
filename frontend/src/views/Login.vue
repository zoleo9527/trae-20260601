<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-title">医疗器械包追踪系统</div>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div style="margin-top: 20px; font-size: 12px; color: #909399;">
        <div style="margin-bottom: 8px;">演示账号（密码均为 123456）：</div>
        <div>admin - 管理员</div>
        <div>nurse_1 - 护士</div>
        <div>cleaner_1 - 清洗员</div>
        <div>sterilizer_1 - 灭菌员</div>
        <div>deliverer_1 - 配送员</div>
        <div>inspector_1 - 质检员</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await authAPI.login(form.value)
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (err) {
        ElMessage.error(err.response?.data?.error || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>
