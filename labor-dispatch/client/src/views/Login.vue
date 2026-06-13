<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>人力派遣公司管理系统</h2>
          <p>用工需求与候选人匹配</p>
        </div>
      </template>

      <el-form :model="loginForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>

        <div class="demo-account">
          <p>演示账号：</p>
          <p>管理员：admin / admin123</p>
          <p>一线人员：user / user123</p>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)

    const loginForm = reactive({
      username: '',
      password: ''
    })

    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const handleLogin = async () => {
      try {
        await formRef.value.validate()
        loading.value = true

        const response = await api.auth.login(loginForm)

        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        ElMessage.success('登录成功')

        router.push('/dashboard')
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '登录失败')
      } finally {
        loading.value = false
      }
    }

    return {
      loginForm,
      rules,
      formRef,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin-bottom: 10px;
  color: #333;
}

.card-header p {
  color: #666;
  font-size: 14px;
}

.demo-account {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
}

.demo-account p {
  margin: 5px 0;
}
</style>
