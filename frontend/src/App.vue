<template>
  <div class="app-container">
    <LoginPage v-if="!user" @login="handleLogin" />
    <MainLayout v-else :user="user" @logout="handleLogout" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import MainLayout from './components/MainLayout.vue'

const user = ref(null)

const handleLogin = (loginUser) => {
  user.value = loginUser
  localStorage.setItem('user', JSON.stringify(loginUser))
}

const handleLogout = () => {
  user.value = null
  localStorage.removeItem('user')
}

const initUser = () => {
  const saved = localStorage.getItem('user')
  if (saved) {
    try {
      user.value = JSON.parse(saved)
    } catch (e) {
      localStorage.removeItem('user')
    }
  }
}

initUser()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  min-height: 100vh;
}
</style>
