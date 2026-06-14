<script setup>
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import ToastContainer from '@/components/ToastContainer.vue'

const store = useAppStore()
</script>

<template>
  <div id="app-root" class="w-full h-full">
    <RouterView />
    <ToastContainer :toasts="store.toasts" />
  </div>
</template>

<style scoped>
#app-root { min-height: 100vh; }
</style>
