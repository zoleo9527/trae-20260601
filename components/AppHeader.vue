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
  </header>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const config = useRuntimeConfig()
const selectedUser = ref('')

const handleSwitch = () => {
  if (selectedUser.value) {
    authStore.switchRole(selectedUser.value)
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    navigateTo(roleMap[authStore.userRole!])
    selectedUser.value = ''
  }
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/login')
}
</script>
