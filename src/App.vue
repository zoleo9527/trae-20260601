<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import ToastContainer from '@/components/shared/ToastContainer.vue'
</script>

<template>
  <div class="flex min-h-screen bg-factory-bg">
    <Sidebar />
    <main class="ml-60 min-h-screen flex-1 bg-factory-bg p-6">
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>
