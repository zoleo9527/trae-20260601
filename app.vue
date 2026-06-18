<script setup lang="ts">
import { ref, computed } from 'vue'
import CourseList from './components/CourseList.vue'
import CourseDetail from './components/CourseDetail.vue'
import WaitlistPanel from './components/WaitlistPanel.vue'
import { users } from './server/data/mockData'

const currentView = ref<'list' | 'detail'>('list')
const selectedCourseId = ref<string | null>(null)
const currentUser = ref(users[4])
const refreshTrigger = ref(0)

const handleCourseSelect = (courseId: string) => {
  selectedCourseId.value = courseId
  currentView.value = 'detail'
  refreshTrigger.value++
}

const handleBackToList = () => {
  currentView.value = 'list'
  selectedCourseId.value = null
  refreshTrigger.value++
}

const handleRefresh = () => {
  refreshTrigger.value++
}

const canReview = computed(() => currentUser.value.role === 'manager')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900">博物馆社教管理系统</h1>
            <span class="badge badge-info">{{ currentUser.name }} · {{ currentUser.department }}</span>
          </div>
          <div class="flex items-center space-x-4">
            <select 
              v-model="currentUser"
              class="input w-48"
            >
              <option v-for="user in users" :key="user.id" :value="user">
                {{ user.name }} ({{ user.role === 'teacher' ? '社教老师' : user.role === 'volunteer' ? '志愿者' : '活动主管' }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <div class="flex-1">
          <CourseList 
            v-if="currentView === 'list'" 
            @select-course="handleCourseSelect"
            :current-user="currentUser"
          />
          <CourseDetail 
            v-else-if="currentView === 'detail' && selectedCourseId" 
            :course-id="selectedCourseId"
            :current-user="currentUser"
            @back="handleBackToList"
            @refresh="handleRefresh"
          />
        </div>
        
        <WaitlistPanel 
          :current-user="currentUser"
          :selected-course-id="selectedCourseId"
          :refresh-trigger="refreshTrigger"
        />
      </div>
    </main>
  </div>
</template>
