<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <LoginPage v-if="!store.state.isLoggedIn" />
    
    <div v-else class="flex flex-1 overflow-hidden">
      <Sidebar :activeMenu="activeMenu" @navigate="handleNavigate" />
      
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <Dashboard v-if="activeMenu === 'dashboard'" />
        <VisitManagement v-else-if="activeMenu === 'visit'" />
        <IssueManagement v-else-if="activeMenu === 'issues' || activeMenu === 'issue-handle'" />
        <EscalationManagement v-else-if="activeMenu === 'escalation'" />
        <Reports v-else-if="activeMenu === 'reports'" />
        <BoundaryDoc v-else-if="activeMenu === 'boundary'" />
      </main>
    </div>
    
    <div
      v-if="showNotification"
      class="fixed bottom-4 right-4 z-50 animate-slide-up"
    >
      <div class="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <CheckCircle v-if="notificationType === 'success'" class="w-5 h-5 text-green-400" />
        <AlertCircle v-else class="w-5 h-5 text-red-400" />
        <span>{{ notificationMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useStore } from '@/store'
import LoginPage from '@/components/LoginPage.vue'
import Sidebar from '@/components/Sidebar.vue'
import Dashboard from '@/components/Dashboard.vue'
import VisitManagement from '@/components/VisitManagement.vue'
import IssueManagement from '@/components/IssueManagement.vue'
import EscalationManagement from '@/components/EscalationManagement.vue'
import Reports from '@/components/Reports.vue'
import BoundaryDoc from '@/components/BoundaryDoc.vue'

const store = useStore()
const activeMenu = ref('dashboard')

const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error'>('success')

function handleNavigate(key: string) {
  activeMenu.value = key
}

function showMessage(message: string, type: 'success' | 'error' = 'success') {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

watch(() => store.state.error, (error) => {
  if (error) {
    showMessage(error, 'error')
    store.clearError()
  }
})

watch(() => store.state.currentUser, () => {
  const role = store.state.currentUser?.role
  if (role === 'socialWorker') {
    activeMenu.value = 'dashboard'
  } else if (role === 'volunteerLeader') {
    activeMenu.value = 'dashboard'
  } else if (role === 'communityLeader') {
    activeMenu.value = 'dashboard'
  }
})
</script>

<style>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
