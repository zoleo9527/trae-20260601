<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '../server/data/mockData'

interface Course {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  status: string
  teacherName: string
  submitterName: string
  openIssues: number
}

const props = defineProps<{
  currentUser: User
}>()

const emit = defineEmits<{
  selectCourse: [courseId: string]
}>()

const courses = ref<Course[]>([])
const loading = ref(true)
const filterStatus = ref<string>('all')

const filteredCourses = computed(() => {
  if (filterStatus.value === 'all') return courses.value
  return courses.value.filter(c => c.status === filterStatus.value)
})

const statusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusBadgeClass: Record<string, string> = {
  draft: 'badge-warning',
  submitted: 'badge-info',
  approved: 'badge-success',
  rejected: 'badge-danger',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger'
}

const hasIssues = (course: Course) => course.openIssues > 0

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/courses')
    courses.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch courses:', error)
  } finally {
    loading.value = false
  }
}

fetchCourses()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">社教课程列表</h2>
      <div class="flex items-center space-x-4">
        <select 
          v-model="filterStatus"
          class="input w-40"
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="submitted">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id"
        class="card hover:shadow-md transition-shadow cursor-pointer"
        @click="emit('selectCourse', course.id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ course.title }}</h3>
              <span :class="statusBadgeClass[course.status]" class="badge">{{ statusLabels[course.status] }}</span>
              <span 
                v-if="hasIssues(course)" 
                class="badge badge-danger animate-pulse"
              >
                {{ course.openIssues }} 个问题
              </span>
            </div>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ course.description }}</p>
            <div class="flex flex-wrap gap-4 text-sm text-gray-500">
              <span><strong class="text-gray-700">日期:</strong> {{ course.date }}</span>
              <span><strong class="text-gray-700">时间:</strong> {{ course.startTime }} - {{ course.endTime }}</span>
              <span><strong class="text-gray-700">地点:</strong> {{ course.location }}</span>
              <span><strong class="text-gray-700">讲师:</strong> {{ course.teacherName }}</span>
              <span><strong class="text-gray-700">提交人:</strong> {{ course.submitterName }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-primary-600">{{ course.currentParticipants }}</div>
            <div class="text-sm text-gray-500">/{{ course.maxParticipants }} 人</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
