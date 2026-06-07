<template>
  <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center">
    <el-card style="width: 420px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3)">
      <div style="text-align: center; margin-bottom: 30px">
        <h2 style="margin: 0; font-size: 24px; color: #333">KTV门店管理系统</h2>
        <p style="margin: 8px 0 0; color: #999; font-size: 14px">酒水出库与赠品核销</p>
      </div>
      <el-form :model="form" ref="formRef" :rules="rules" label-width="80px" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" size="large" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div style="margin-top: 20px; padding: 12px; background: #f5f7fa; border-radius: 8px; font-size: 13px; color: #666">
        <div style="font-weight: 500; margin-bottom: 8px">测试账号：</div>
        <div>预订员：yuding / 123456</div>
        <div>楼面经理：loumian / 123456</div>
        <div>吧台：batai / 123456</div>
        <div>管理员：admin / 123456</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    const data = await login(form)
    userStore.setUser(data)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>
