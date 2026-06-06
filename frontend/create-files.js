const fs = require('fs');
const path = require('path');

const files = {
  'src/router/index.ts': `import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'keys', name: 'Keys', component: () => import('@/views/Keys.vue') },
      { path: 'keys/:id', name: 'KeyDetail', component: () => import('@/views/KeyDetail.vue') },
      { path: 'borrow', name: 'Borrow', component: () => import('@/views/Borrow.vue') },
      { path: 'lost', name: 'Lost', component: () => import('@/views/Lost.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.user) {
    next('/login')
  } else if (to.path === '/login' && userStore.user) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
`,

  'src/views/Login.vue': `<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>宿舍钥匙管理系统</h1>
        <p>Dormitory Key Management System</p>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const selectedRole = ref<string>('')
const userName = ref<string>('')

const roles = [
  { value: 'dorm_manager', label: '宿管员' },
  { value: 'counselor', label: '辅导员' },
  { value: 'maintenance', label: '维修人员' }
]

const handleLogin = () => {
  if (!selectedRole.value || !userName.value.trim()) {
    ElMessage.warning('请选择角色并输入姓名')
    return
  }
  userStore.login(selectedRole.value as any, userName.value.trim())
  ElMessage.success('登录成功')
  router.push('/dashboard')
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

.login-header p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
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
`,

  'src/views/Keys.vue': `<template>
  <div class="keys-page">
    <div class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="楼栋">
          <el-select v-model="filters.building" placeholder="全部楼栋" clearable style="width: 120px">
            <el-option label="1栋" value="1" />
            <el-option label="2栋" value="2" />
            <el-option label="3栋" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间">
          <el-input v-model="filters.room" placeholder="房间号" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="在库" value="available" />
            <el-option label="借出" value="borrowed" />
            <el-option label="挂失" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadKeys">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="keys" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="key_number" label="钥匙编号" width="120" />
        <el-table-column label="位置" width="150">
          <template #default="{ row }">
            {{ row.building }}栋 {{ row.room }}室
          </template>
        </el-table-column>
        <el-table-column prop="key_type" label="类型" width="100">
          <template #default="{ row }">
            {{ row.key_type === 'room' ? '房间' : '公共' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span class="status-dot" :class="'status-' + row.status"></span>
            {{ getStatusLabel(row.status) }}
          </template>
        </el-table-column>
        <el-table-column prop="current_holder" label="当前持有人" width="120">
          <template #default="{ row }">
            {{ row.current_holder || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="success" link size="small" :disabled="row.status !== 'available'" @click="handleBorrow(row)">借用</el-button>
            <el-button type="warning" link size="small" :disabled="row.status !== 'borrowed'" @click="handleReturn(row)">归还</el-button>
            <el-button type="danger" link size="small" :disabled="row.status === 'lost'" @click="handleLost(row)">挂失</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getKeys, getStudents, borrowKey, returnKey, reportLost } from '@/api'
import type { Key } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const keys = ref<Key[]>([])

const filters = reactive({
  building: '',
  room: '',
  status: '',
  holder: ''
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: '在库',
    borrowed: '借出',
    lost: '挂失'
  }
  return labels[status] || status
}

const loadKeys = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.building) params.building = filters.building
    if (filters.room) params.room = filters.room
    if (filters.status) params.status = filters.status
    keys.value = await getKeys(params)
  } catch (error) {
    ElMessage.error('加载钥匙列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.building = ''
  filters.room = ''
  filters.status = ''
  filters.holder = ''
  loadKeys()
}

const viewDetail = (row: Key) => {
  router.push('/keys/' + row.id)
}

const handleBorrow = async (row: Key) => {
  try {
    const students = await getStudents()
    if (students.length === 0) {
      ElMessage.warning('没有可用的学生')
      return
    }
    await borrowKey({
      key_id: row.id,
      student_id: students[0].id,
      operator: userStore.user?.name || ''
    })
    ElMessage.success('借用成功')
    loadKeys()
  } catch (error) {
  }
}

const handleReturn = async (row: Key) => {
  try {
    await ElMessageBox.confirm('确定要归还钥匙 ' + row.key_number + ' 吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await returnKey({
      key_id: row.id,
      operator: userStore.user?.name || ''
    })
    ElMessage.success('归还成功')
    loadKeys()
  } catch (error) {
  }
}

const handleLost = async (row: Key) => {
  try {
    await reportLost({
      key_id: row.id,
      student_name: row.current_holder || '未知',
      lost_reason: '钥匙丢失',
      operator: userStore.user?.name || ''
    })
    ElMessage.success('挂失成功')
    loadKeys()
  } catch (error) {
  }
}

onMounted(() => {
  loadKeys()
})
</script>

<style scoped>
.keys-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card,
.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.status-available {
  background-color: #10b981;
}

.status-borrowed {
  background-color: #f59e0b;
}

.status-lost {
  background-color: #ef4444;
}
</style>
`
};

for (const [filepath, content] of Object.entries(files)) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, content);
  console.log('Created: ' + filepath);
}

console.log('All files created successfully!');
