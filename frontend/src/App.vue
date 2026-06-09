<script setup>
import { provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from './components/Layout.vue'

const router = useRouter()
const auth = ref(JSON.parse(localStorage.getItem('auth') || 'null'))

provide('auth', auth)

router.afterEach(() => {
  auth.value = JSON.parse(localStorage.getItem('auth') || 'null')
})
</script>

<template>
  <router-view />
</template>
