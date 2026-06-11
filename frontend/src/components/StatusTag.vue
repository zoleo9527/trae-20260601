<template>
  <el-tag v-if="map[status]" :type="map[status].type" :effect="map[status].effect" class="status-tag">
    {{ map[status].icon }} {{ map[status].text }}
  </el-tag>
  <el-tag v-else>{{ status }}</el-tag>
</template>

<script setup>
defineProps({ status: { type: String, required: true } })
const map = {
  DRAFT: { type: 'info', text: '草稿', icon: '📝', effect: 'plain' },
  PENDING: { type: 'warning', text: '待确认扣点', icon: '⏳', effect: 'light' },
  ACTIVE: { type: 'success', text: '已生效', icon: '✅', effect: 'dark' },
  REJECTED: { type: 'danger', text: '已驳回', icon: '❌', effect: 'light' },
  EXPIRED: { type: 'info', text: '已到期', icon: '📅', effect: 'plain' },
  CONFIRMED: { type: 'success', text: '已确认', icon: '✓', effect: 'light' },
  PENDING_CONFIRM: { type: 'warning', text: '待确认', icon: '⏳', effect: 'plain' },
  SUPERSEDED: { type: 'info', text: '已替代', icon: '↔️', effect: 'plain' },
  PROCESSING: { type: 'warning', text: '处理中', icon: '⚙️', effect: 'light' },
  COMPLETED: { type: 'success', text: '已完成', icon: '✅', effect: 'light' },
  FAILED: { type: 'danger', text: '失败', icon: '❌', effect: 'light' },
}
</script>
