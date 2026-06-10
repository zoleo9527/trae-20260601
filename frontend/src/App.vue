<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">🍎 观光果园</h1>
        <span class="app-subtitle">投诉登记与补偿发放</span>
      </div>
      <div class="header-right">
        <select v-model="currentRole" @change="handleRoleChange" class="role-select">
          <option v-for="role in roles" :key="role.key" :value="role.key">
            {{ role.name }} - {{ currentUserName }}
          </option>
        </select>
      </div>
    </header>
    <nav class="app-nav">
      <router-link to="/" class="nav-item" exact-active-class="active">
        📋 我的待办
      </router-link>
      <router-link to="/complaints" class="nav-item" active-class="active">
        📁 投诉列表
      </router-link>
      <router-link v-if="isCustomerService" to="/register" class="nav-item" active-class="active">
        ✏️ 投诉登记
      </router-link>
    </nav>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRoles, getUsers } from './api/user'

const router = useRouter()
const roles = ref([])
const currentRole = ref('CUSTOMER_SERVICE')
const users = ref([])

const isCustomerService = computed(() => currentRole.value === 'CUSTOMER_SERVICE')

const currentUserName = computed(() => {
  const user = users.value.find(u => u.role === currentRole.value)
  return user ? user.name : ''
})

const currentUserId = computed(() => {
  const user = users.value.find(u => u.role === currentRole.value)
  return user ? user.id : ''
})

function handleRoleChange() {
  localStorage.setItem('currentRole', currentRole.value)
  localStorage.setItem('currentUserId', currentUserId.value)
  router.go(0)
}

async function loadRoles() {
  try {
    const res = await getRoles()
    if (res.code === 0) {
      roles.value = res.data
    }
  } catch (e) {
    roles.value = [
      { key: 'CUSTOMER_SERVICE', name: '园区客服' },
      { key: 'PICKING_GUIDE', name: '采摘向导' },
      { key: 'WAREHOUSE_STAFF', name: '仓库员' }
    ]
  }
}

async function loadUsers() {
  try {
    const res = await getUsers()
    if (res.code === 0) {
      users.value = res.data
    }
  } catch (e) {
    users.value = [
      { id: 'u1', name: '李园园', role: 'CUSTOMER_SERVICE' },
      { id: 'u2', name: '王向导', role: 'PICKING_GUIDE' },
      { id: 'u4', name: '陈仓库', role: 'WAREHOUSE_STAFF' }
    ]
  }
}

function syncUserIdToStorage() {
  const uid = currentUserId.value
  if (uid) {
    localStorage.setItem('currentUserId', uid)
  } else {
    const fallbackMap = {
      CUSTOMER_SERVICE: 'u1',
      PICKING_GUIDE: 'u2',
      WAREHOUSE_STAFF: 'u4'
    }
    localStorage.setItem('currentUserId', fallbackMap[currentRole.value] || 'u1')
  }
}

async function init() {
  const savedRole = localStorage.getItem('currentRole')
  if (savedRole) currentRole.value = savedRole

  await Promise.all([loadRoles(), loadUsers()])
  syncUserIdToStorage()
}

onMounted(() => {
  init()
})
</script>
