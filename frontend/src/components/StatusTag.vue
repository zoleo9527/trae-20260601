<template>
  <el-tag :type="tagType" :size="size" effect="light">
    {{ displayText }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'default'
  }
})

const statusMap = {
  property: {
    vacant: { text: '空置中', type: 'warning' },
    occupied: { text: '已出租', type: 'success' },
    reserved: { text: '已预定', type: 'info' },
    maintenance: { text: '维护中', type: 'danger' }
  },
  viewing: {
    scheduled: { text: '待带看', type: 'primary' },
    completed: { text: '已完成', type: 'success' },
    cancelled: { text: '已取消', type: 'info' },
    no_show: { text: '客户未到', type: 'warning' }
  },
  exception: {
    pending: { text: '待处理', type: 'danger' },
    processing: { text: '处理中', type: 'warning' },
    resolved: { text: '已解决', type: 'success' },
    closed: { text: '已关闭', type: 'info' }
  },
  severity: {
    low: { text: '低', type: 'info' },
    normal: { text: '中', type: 'warning' },
    high: { text: '高', type: 'danger' },
    critical: { text: '紧急', type: 'danger' }
  }
}

const displayText = computed(() => {
  const map = statusMap[props.type]
  return map?.[props.status]?.text || props.status || '-'
})

const tagType = computed(() => {
  const map = statusMap[props.type]
  return map?.[props.status]?.type || 'info'
})
</script>
