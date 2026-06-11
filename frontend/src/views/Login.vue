<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <h1>🏬 奥特莱斯运营管理系统</h1>
        <p>品牌租约 & 扣点规则管理平台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" type="password" show-password :prefix-icon="Lock" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">登 录</el-button>
        </el-form-item>
      </el-form>

      <div class="quick-accounts">
        <div class="title">快速体验：</div>
        <div class="accounts">
          <el-tag v-for="a in accounts" :key="a.username" :type="a.type" class="account-tag" @click="fillAccount(a)">
            <b>{{ a.roleName }}</b>
            <span>{{ a.username }} / 123456</span>
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const accounts = [
  { username: 'zhaoshang1', roleName: '招商经理', type: '' },
  { username: 'yingyun1', roleName: '营运督导', type: 'success' },
  { username: 'zhuguan', roleName: '主管', type: 'warning' },
  { username: 'dianzhang1', roleName: '品牌店长', type: 'info' },
]

const fillAccount = (a) => {
  form.username = a.username
  form.password = '123456'
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.loginAction(form)
    ElMessage.success(`欢迎回来，${userStore.userName}`)
    router.replace(route.query.redirect || '/dashboard')
  } catch (e) {
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 16px;
  width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.brand { text-align: center; margin-bottom: 30px; }
.brand h1 { font-size: 22px; margin: 0 0 8px; color: #1f2937; }
.brand p { margin: 0; color: #6b7280; font-size: 13px; }
.login-btn { width: 100%; height: 44px; font-size: 16px; }
.quick-accounts { margin-top: 20px; padding-top: 20px; border-top: 1px dashed #e5e7eb; }
.quick-accounts .title { font-size: 12px; color: #6b7280; margin-bottom: 10px; }
.accounts { display: flex; flex-wrap: wrap; gap: 8px; }
.account-tag { cursor: pointer; display: flex; flex-direction: column; padding: 6px 10px; }
.account-tag span { font-size: 11px; opacity: 0.8; }
</style>
