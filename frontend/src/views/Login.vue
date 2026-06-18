<template>
  <div class="login-container">
    <div class="login-box">
      <h2>社区志愿服务站管理系统</h2>
      <el-form ref="formRef" :model="form" label-width="80px" class="login-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="demo-users">
        <p>演示用户：</p>
        <ul>
          <li>社工: social / 123456</li>
          <li>队长: leader / 123456</li>
          <li>干部: official / 123456</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const form = reactive({
  username: '',
  password: ''
})

async function handleLogin() {
  try {
    await authStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error('登录失败：用户名或密码错误')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 400px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}

.demo-users {
  border-top: 1px solid #eee;
  padding-top: 15px;
  font-size: 12px;
  color: #666;
}

.demo-users p {
  margin-bottom: 8px;
}

.demo-users ul {
  list-style: none;
  padding: 0;
}

.demo-users li {
  padding: 4px 0;
}
</style>