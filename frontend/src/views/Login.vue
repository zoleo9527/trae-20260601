<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#409eff"><OfficeBuilding /></el-icon>
        <h1>商场运营管理系统</h1>
        <p>租户入驻与证照管理</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @keyup.enter="handleLogin"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="demo-accounts">
        <div class="demo-title">演示账号</div>
        <div class="demo-list">
          <el-tag
            v-for="account in demoAccounts"
            :key="account.username"
            class="demo-tag"
            :type="account.type"
            @click="fillAccount(account)"
          >
            {{ account.label }}：{{ account.username }} / {{ account.password }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const demoAccounts = [
  { username: 'admin', password: 'admin123', label: '管理员', type: '' as const },
  { username: 'operation', password: 'op123', label: '营运专员', type: 'success' as const },
  { username: 'service', password: 'sv123', label: '客服台', type: 'warning' as const },
  { username: 'engineering', password: 'en123', label: '工程部', type: 'danger' as const }
]

function fillAccount(account: any) {
  form.username = account.username
  form.password = account.password
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.login(form.username, form.password)
      ElMessage.success('登录成功')
      router.push('/')
    } catch {
      // error handled by interceptor
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 22px;
    color: #303133;
    margin: 12px 0 4px;
  }

  p {
    font-size: 14px;
    color: #909399;
  }
}

.demo-accounts {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  .demo-title {
    font-size: 13px;
    color: #909399;
    margin-bottom: 8px;
  }

  .demo-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .demo-tag {
    cursor: pointer;
    font-size: 12px;
    transition: transform 0.1s;

    &:hover {
      transform: scale(1.05);
    }
  }
}
</style>
