<template>
  <div class="app-container">
    <router-view v-if="!isLoginPage" />
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>