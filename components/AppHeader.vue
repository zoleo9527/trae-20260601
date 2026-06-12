<template>
  <header class="header">
    <div class="header-content">
      <h1>{{ config.public.appName }}</h1>
      <div class="user-info">
        <span>{{ authStore.currentUser?.department }} - {{ authStore.roleName }}</span>
        <select v-model="selectedUser" @change="handleSwitch">
          <option value="">切换角色</option>
          <optgroup label="招商经理">
            <option v-for="u in authStore.getUsersByRole('manager')" :key="u.id" :value="u.id">
              {{ u.name }}
            </option>
          </optgroup>
          <optgroup label="招商主管">
            <option v-for="u in authStore.getUsersByRole('director')" :key="u.id" :value="u.id">
              {{ u.name }}
            </option>
          </optgroup>
          <optgroup label="物业工程">
            <option v-for="u in authStore.getUsersByRole('engineer')" :key="u.id" :value="u.id">
              {{ u.name }}
            </option>
          </optgroup>
        </select>
        <button class="btn btn-secondary" @click="handleLogout">退出</button>
      </div>
    </div>
    <div v-if="forbiddenMsg" class="forbidden-banner">
      ⛔ {{ forbiddenMsg }}
      <button class="forbidden-close" @click="dismissForbidden">×</button>
    </div>
  </header>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const selectedUser = ref('')
const forbiddenMsg = ref('')

onMounted(() => {
  if (route.query.forbidden === '1') {
    const from = route.query.from || ''
    const role = route.query.role || ''
    forbiddenMsg.value = `无权访问${role ? role + '工作台' : from}，已自动跳转至您的工作台`
    router.replace({ path: route.path, query: {} })
  }
})

const dismissForbidden = () => {
  forbiddenMsg.value = ''
}

const handleSwitch = () => {
  if (selectedUser.value) {
    authStore.switchRole(selectedUser.value)
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    navigateTo(roleMap[authStore.userRole!], { replace: true })
    selectedUser.value = ''
  }
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/login', { replace: true })
}
</script>

<style scoped>
.forbidden-banner {
  background: #fef2f2;
  border-bottom: 2px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem 2rem;
  text-align: center;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.forbidden-close {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.5rem;
}
</style>
