<template>
  <div class="app-container">
    <router-view v-if="!isLoginPage" />
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const isLoginPage = computed(() => route.path === '/login')

onMounted(async () => {
  await authStore.refreshUser()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>