<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ReplacementFilters, ReplacementStatus } from '../types'
import { STATUS_LABEL } from '../types/enums'

interface Props {
  filters: ReplacementFilters
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索关键词',
})

const emit = defineEmits<{
  'update:filters': [filters: ReplacementFilters]
  search: []
}>()

const localKeyword = ref(props.filters.keyword || '')
const localStatus = ref<ReplacementStatus | ''>(props.filters.status || '')
const localStartDate = ref(props.filters.dateRange?.start || '')
const localEndDate = ref(props.filters.dateRange?.end || '')

watch(
  () => props.filters,
  (newFilters) => {
    localKeyword.value = newFilters.keyword || ''
    localStatus.value = newFilters.status || ''
    localStartDate.value = newFilters.dateRange?.start || ''
    localEndDate.value = newFilters.dateRange?.end || ''
  }
)

function emitFilters() {
  const filters: ReplacementFilters = {}
  if (localKeyword.value) filters.keyword = localKeyword.value
  if (localStatus.value) filters.status = localStatus.value
  if (localStartDate.value || localEndDate.value) {
    filters.dateRange = {
      start: localStartDate.value,
      end: localEndDate.value,
    }
  }
  emit('update:filters', filters)
}

function handleReset() {
  localKeyword.value = ''
  localStatus.value = ''
  localStartDate.value = ''
  localEndDate.value = ''
  emit('update:filters', {})
  emit('search')
}

function handleSearch() {
  emitFilters()
  emit('search')
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200">
    <input
      v-model="localKeyword"
      type="text"
      :placeholder="props.placeholder"
      class="px-3 py-2 text-sm border border-gray-300 bg-white w-64 focus:outline-none focus:border-blue-500"
      @keyup.enter="handleSearch"
    />

    <select
      v-model="localStatus"
      class="px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
    >
      <option value="">全部状态</option>
      <option
        v-for="(label, value) in STATUS_LABEL"
        :key="value"
        :value="value"
      >
        {{ label }}
      </option>
    </select>

    <div class="flex items-center gap-2">
      <input
        v-model="localStartDate"
        type="date"
        class="px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
      />
      <span class="text-gray-500 text-sm">至</span>
      <input
        v-model="localEndDate"
        type="date"
        class="px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
      />
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <button
        type="button"
        class="px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        @click="handleReset"
      >
        重置
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm bg-blue-900 text-white hover:bg-blue-800 transition-colors"
        @click="handleSearch"
      >
        搜索
      </button>
    </div>
  </div>
</template>
