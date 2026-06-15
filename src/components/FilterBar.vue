<script setup lang="ts">
defineProps<{
  statusFilter: string
  categoryFilter: string
  dateFilter: string
}>()

const emit = defineEmits<{
  (e: 'update:statusFilter', value: string): void
  (e: 'update:categoryFilter', value: string): void
  (e: 'update:dateFilter', value: string): void
}>()

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'reviewed', label: '已回访' },
  { value: 'resolved', label: '已解决' }
]

const categoryOptions = [
  { value: '', label: '全部类型' },
  { value: 'service', label: '服务内容' },
  { value: 'attitude', label: '服务态度' },
  { value: 'timeliness', label: '准时性' },
  { value: 'quality', label: '服务质量' },
  { value: 'other', label: '其他' }
]

const dateOptions = [
  { value: '', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' }
]
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-4 mb-4">
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-600">状态:</label>
        <select 
          :value="statusFilter"
          @change="emit('update:statusFilter', ($event.target as HTMLSelectElement).value)"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-600">类型:</label>
        <select 
          :value="categoryFilter"
          @change="emit('update:categoryFilter', ($event.target as HTMLSelectElement).value)"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-600">时间:</label>
        <select 
          :value="dateFilter"
          @change="emit('update:dateFilter', ($event.target as HTMLSelectElement).value)"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="opt in dateOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
