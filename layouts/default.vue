<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
            园
          </div>
          <div>
            <h1 class="text-[15px] font-semibold text-gray-900 leading-tight">产业园招商</h1>
            <p class="text-xs text-gray-500">租赁方案与合同审批工作台</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">当前角色：</span>
            <select
              :value="store.currentUserId"
              @change="e => store.switchUser((e.target as HTMLSelectElement).value)"
              class="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="u in userList" :key="u.id" :value="u.id">
                {{ u.name }} · {{ roleLabel(u.role) }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
              {{ store.currentUser.name.charAt(0) }}
            </div>
            <div class="text-sm">
              <p class="font-medium text-gray-900 leading-tight">{{ store.currentUser.name }}</p>
              <p class="text-xs text-gray-500">{{ store.currentUser.department }}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
    <main class="max-w-[1600px] mx-auto px-6 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useLeaseStore } from '~/stores/lease'
import { USERS, getRoleLabel } from '~/utils/constants'

const store = useLeaseStore()
const userList = Object.values(USERS)
const roleLabel = getRoleLabel
</script>
