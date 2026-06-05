<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { RoleType } from './types';
import { useStore } from './store';
import Dashboard from './components/Dashboard.vue';
import BookingList from './components/BookingList.vue';
import VerificationHistory from './components/VerificationHistory.vue';
import BookingModal from './components/BookingModal.vue';

const store = useStore();

const currentPage = ref('dashboard');
const selectedBookingId = ref<number | null>(null);
const showBookingModal = ref(false);

const roleName = computed(() => {
  const map: Record<RoleType, string> = {
    reception: '场馆前台',
    coach: '教练',
    manager: '值班店长',
  };
  return map[store.state.currentRole];
});

const handleRoleChange = (role: RoleType) => {
  store.setRole(role);
};

const handleTodoClick = (id: number) => {
  selectedBookingId.value = id;
  showBookingModal.value = true;
};

const handleBookingClick = (id: number) => {
  selectedBookingId.value = id;
  showBookingModal.value = true;
};

const handleRefresh = () => {
  store.refreshAll();
};

onMounted(() => {
  store.loadBaseData();
  store.loadTodos();
});
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>🏸 球馆运营系统</h1>
        <div class="sub">场地预约与会员核销</div>
      </div>

      <div class="role-selector">
        <label>当前角色</label>
        <select :value="store.state.currentRole" @change="handleRoleChange(($event.target as HTMLSelectElement).value as RoleType)">
          <option value="reception">场馆前台</option>
          <option value="coach">教练</option>
          <option value="manager">值班店长</option>
        </select>
      </div>

      <nav class="nav-menu">
        <div
          class="nav-item"
          :class="{ active: currentPage === 'dashboard' }"
          @click="currentPage = 'dashboard'"
        >
          <span class="icon">📊</span>
          <span>工作台</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'bookings' }"
          @click="currentPage = 'bookings'"
        >
          <span class="icon">📅</span>
          <span>场地预约</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'verify' }"
          @click="currentPage = 'verify'"
        >
          <span class="icon">✅</span>
          <span>核销回看</span>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="top-bar">
        <h2>
          {{ currentPage === 'dashboard' ? '工作台' : currentPage === 'bookings' ? '场地预约' : '核销回看' }}
        </h2>
        <div class="user-info">当前身份：{{ roleName }}</div>
      </div>

      <div class="content-area">
        <Dashboard
          v-if="currentPage === 'dashboard'"
          @todo-click="handleTodoClick"
        />

        <BookingList
          v-if="currentPage === 'bookings'"
          @row-click="handleBookingClick"
        />

        <VerificationHistory
          v-if="currentPage === 'verify'"
          @row-click="handleBookingClick"
        />
      </div>
    </main>

    <BookingModal
      v-if="showBookingModal && selectedBookingId"
      :booking-id="selectedBookingId"
      @close="showBookingModal = false"
      @refresh="handleRefresh"
    />
  </div>
</template>
