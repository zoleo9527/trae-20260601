import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RoleType } from '@/types';

export const useUiStore = defineStore('ui', () => {
  const currentRole = ref<RoleType | null>(null);
  const selectedOrderId = ref<string | null>(null);
  const drawerVisible = ref(false);
  const stuckBannerCollapsed = ref(false);

  const isStuckBannerShown = computed(() => !stuckBannerCollapsed.value);

  function setRole(role: RoleType) {
    currentRole.value = role;
  }
  function clearRole() {
    currentRole.value = null;
  }
  function openOrderDrawer(orderId: string) {
    selectedOrderId.value = orderId;
    drawerVisible.value = true;
  }
  function closeDrawer() {
    drawerVisible.value = false;
    selectedOrderId.value = null;
  }
  function toggleStuckBanner() {
    stuckBannerCollapsed.value = !stuckBannerCollapsed.value;
  }

  return {
    currentRole,
    selectedOrderId,
    drawerVisible,
    stuckBannerCollapsed,
    isStuckBannerShown,
    setRole,
    clearRole,
    openOrderDrawer,
    closeDrawer,
    toggleStuckBanner,
  };
});
