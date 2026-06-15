<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import LoginPage from '~/components/LoginPage.vue'
import AppLayout from '~/components/AppLayout.vue'
import DashboardPage from '~/components/DashboardPage.vue'
import AppointmentsPage from '~/components/AppointmentsPage.vue'
import InventoryPage from '~/components/InventoryPage.vue'
import ExceptionsPage from '~/components/ExceptionsPage.vue'

const { isLoggedIn } = useAuth()
const currentPage = ref('dashboard')
const highlightId = ref<string | undefined>(undefined)

const showLayout = computed(() => isLoggedIn.value)

const handleNavigate = (page: string, id?: string) => {
  currentPage.value = page
  highlightId.value = id
}
</script>

<template>
  <div>
    <LoginPage v-if="!showLayout" />
    
    <AppLayout v-else @navigate="handleNavigate">
      <DashboardPage v-if="currentPage === 'dashboard'" @navigate="handleNavigate" />
      <AppointmentsPage v-else-if="currentPage === 'appointments'" :highlight-id="highlightId" />
      <InventoryPage v-else-if="currentPage === 'inventory'" />
      <ExceptionsPage v-else-if="currentPage === 'exceptions'" :highlight-id="highlightId" />
    </AppLayout>
  </div>
</template>