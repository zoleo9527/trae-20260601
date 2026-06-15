<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">手机维修店管理系统</div>
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" @keyup.enter="login" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" @keyup.enter="login" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login" :loading="loading" style="width: 100%">登录</el-button>
        </el-form-item>
        <div class="user-hints">
          <span>测试用户: admin/frontdesk/technician/manager</span>
          <span>密码: 任意</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auth } from '../api'

const router = useRouter()
const loginForm = reactive({
  username: '',
  password: '123456'
})
const loading = ref(false)

const login = async () => {
  if (!loginForm.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  loading.value = true
  try {
    const res = await auth.login(loginForm.username, loginForm.password)
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    router.push('/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
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

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 400px;
}

.login-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
}

.user-hints {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.user-hints span {
  display: block;
  margin-bottom: 5px;
}
</style>
