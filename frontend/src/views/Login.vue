<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#409eff"><ShoppingCart /></el-icon>
        <h1>奥特莱斯运营系统</h1>
        <p class="subtitle">折扣活动与价格报备管理平台</p>
      </div>
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
      <div class="account-tips">
        <h4>测试账号：</h4>
        <ul>
          <li><b>store1</b> / 123456 - 品牌店长</li>
          <li><b>supervisor1</b> / 123456 - 营运督导</li>
          <li><b>manager1</b> / 123456 - 招商经理</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, ShoppingCart } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginForm.value) return
  try {
    await loginForm.value.validate()
    loading.value = true
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    console.error('Login error:', e)
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

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.account-tips {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
}

.account-tips h4 {
  margin-bottom: 8px;
  color: #303133;
}

.account-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.account-tips li {
  padding: 4px 0;
}
</style>
