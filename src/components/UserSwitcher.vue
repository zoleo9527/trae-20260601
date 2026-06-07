<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span class="text-2xl">{{ store.currentUser.avatar }}</span>
      <div class="text-left">
        <p class="text-sm font-medium text-gray-900">
          {{ store.currentUser.name }}
        </p>
        <p class="text-xs text-gray-500">
          {{ store.roleLabel(store.currentUser.role) }}
        </p>
      </div>
      <svg
        class="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50"
    >
      <div class="px-4 py-3 border-b">
        <p class="text-xs text-gray-500 mb-2">🔑 切换演示账号</p>
      </div>
      <div class="py-1">
        <button
          v-for="user in store.users"
          :key="user.id"
          @click="switchUser(user.id)"
          class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          :class="{ 'bg-blue-50': user.id === store.currentUser.id }"
        >
          <span class="text-2xl">{{ user.avatar }}</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
            <p class="text-xs text-gray-500">
              {{ store.roleLabel(user.role) }}
            </p>
          </div>
          <span
            v-if="user.id === store.currentUser.id"
            class="text-blue-600 text-sm"
            >✓</span
          >
        </button>
      </div>
      <div class="px-4 py-2 bg-gray-50 rounded-b-lg">
        <p class="text-xs text-gray-400">演示模式 - 切换角色体验不同权限</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useGasStationStore } from "@/stores/gasStation";

const store = useGasStationStore();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const switchUser = (userId: string) => {
  store.switchUser(userId);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
