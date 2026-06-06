<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>宿舍钥匙管理系统</h1>
      </div>
      <div class="login-form">
        <h3>选择您的角色登录</h3>
        <div class="role-list">
          <div
            v-for="role in roles"
            :key="role.value"
            class="role-item"
            :class="{ active: selectedRole === role.value }"
            @click="selectedRole = role.value"
          >
            <span class="role-name">{{ role.label }}</span>
          </div>
        </div>
        <el-input
          v-model="userName"
          placeholder="请输入您的姓名"
          size="large"
          class="name-input"
        />
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :disabled="!selectedRole || !userName.trim()"
          @click="handleLogin"
        >
          登录系统
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { ElMessage } from "element-plus"

const router = useRouter()
const userStore = useUserStore()

const selectedRole = ref<string>("")
const userName = ref<string>("")

const roles = [
  { value: "dorm_manager", label: "宿管员" },
  { value: "counselor", label: "辅导员" },
  { value: "maintenance", label: "维修人员" }
]

const handleLogin = () => {
  if (!selectedRole.value || !userName.value.trim()) {
    ElMessage.warning("请选择角色并输入姓名")
    return
  }
  userStore.login(selectedRole.value as any, userName.value.trim())
  ElMessage.success("登录成功")
  router.push("/dashboard")
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  width: 480px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 24px;
  color: #1e3a5f;
  margin: 0 0 8px;
  font-weight: 600;
}

.login-form h3 {
  text-align: center;
  color: #374151;
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 500;
}

.role-list {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.role-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.role-item:hover {
  border-color: #1e3a5f;
  color: #1e3a5f;
}

.role-item.active {
  border-color: #1e3a5f;
  background: #1e3a5f;
  color: #fff;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
}

.name-input {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  background: #1e3a5f;
  border: none;
}

.login-btn:hover {
  background: #2d4a6f;
}
</style>
