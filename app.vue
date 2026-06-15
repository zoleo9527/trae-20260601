<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import LoginPage from '~/components/LoginPage.vue'
import AppLayout from '~/components/AppLayout.vue'
import DashboardPage from '~/components/DashboardPage.vue'
import AppointmentsPage from '~/components/AppointmentsPage.vue'
import InventoryPage from '~/components/InventoryPage.vue'
import ExceptionsPage from '~/components/ExceptionsPage.vue'

const { isLoggedIn } = useAuth()
const currentPage = ref('dashboard')

const showLayout = computed(() => isLoggedIn.value)

const handleNavigate = (page: string) => {
  currentPage.value = page
}

onMounted(() => {
  const path = window.location.pathname.replace('/', '')
  if (path && ['dashboard', 'appointments', 'inventory', 'exceptions'].includes(path)) {
    currentPage.value = path
  }
})
</script>

<template>
  <div>
    <LoginPage v-if="!showLayout" />
    
    <AppLayout v-else @navigate="handleNavigate">
      <DashboardPage v-if="currentPage === 'dashboard'" />
      <AppointmentsPage v-else-if="currentPage === 'appointments'" />
      <InventoryPage v-else-if="currentPage === 'inventory'" />
      <ExceptionsPage v-else-if="currentPage === 'exceptions'" />
    </AppLayout>
  </div>
</template>
