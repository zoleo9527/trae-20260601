<script setup>
const props = defineProps({ toasts: { type: Array, default: () => [] } })

const icons = {
  success: '✓', error: '✕', warning: '!', info: 'i'
}
const colors = {
  success: 'toast-success', error: 'toast-error', warning: 'toast-warning', info: 'toast-info'
}
const iconColors = {
  success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#06b6d4'
}
</script>

<template>
  <div class="toast-wrap">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="colors[t.type]">
      <span
        style="width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0;"
        :style="{ background: iconColors[t.type] }"
      >{{ icons[t.type] }}</span>
      <span style="font-size:13px;color:#374151;flex:1;">{{ t.message }}</span>
    </div>
  </div>
</template>
