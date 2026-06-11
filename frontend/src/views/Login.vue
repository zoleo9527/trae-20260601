<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="login-header">
          <el-icon :size="32" color="#409EFF"><OfficeBuilding /></el-icon>
          <h2>商场运营-公共报修与工程派单系统</h2>
        </div>
      </template>
      <el-form label-width="100px" size="large">
        <el-form-item label="选择用户">
          <el-select v-model="selectedUser" placeholder="请选择演示用户" style="width: 100%">
            <el-option
              v-for="u in demoUsers"
              :key="u.id"
              :label="`${u.name}（${u.role_label}）`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleLogin" :disabled="!selectedUser">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-roles">
        <el-tag v-for="u in demoUsers" :key="u.id" :type="u.tag_type" effect="plain" class="role-tag">
          {{ u.role_label }}：{{ u.name }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const selectedUser = ref(null)

const demoUsers = [
  { id: 1, name: '张运营', role: 'operation', role_label: '营运专员', tag_type: '' },
  { id: 2, name: '李运营', role: 'operation', role_label: '营运专员', tag_type: '' },
  { id: 3, name: '王客服', role: 'service_desk', role_label: '客服台', tag_type: 'success' },
  { id: 4, name: '赵客服', role: 'service_desk', role_label: '客服台', tag_type: 'success' },
  { id: 5, name: '陈电气', role: 'engineering', role_label: '工程部', tag_type: 'warning' },
  { id: 6, name: '刘水管', role: 'engineering', role_label: '工程部', tag_type: 'warning' },
  { id: 7, name: '孙综合', role: 'engineering', role_label: '工程部', tag_type: 'warning' },
  { id: 8, name: '系统管理员', role: 'admin', role_label: '管理员', tag_type: 'danger' },
]

const roleRoutes = {
  operation: '/operation/repairs',
  service_desk: '/service/pending',
  engineering: '/engineering/pending',
  admin: '/operation/repairs',
}

const handleLogin = () => {
  const user = demoUsers.find(u => u.id === selectedUser.value)
  if (!user) return
  localStorage.setItem('user', JSON.stringify(user))
  ElMessage.success(`欢迎，${user.name}！`)
  router.push(roleRoutes[user.role])
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
.login-card {
  width: 480px;
  border-radius: 12px;
}
.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.login-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
.login-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding-top: 8px;
}
.role-tag {
  font-size: 13px;
}
</style>
