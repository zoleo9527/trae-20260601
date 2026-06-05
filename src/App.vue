<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { RoleType, Court, Coach, MemberCard } from './types';
import { api } from './api';
import Dashboard from './components/Dashboard.vue';
import BookingList from './components/BookingList.vue';
import VerificationHistory from './components/VerificationHistory.vue';
import BookingModal from './components/BookingModal.vue';

const currentRole = ref<RoleType>('reception');
const currentPage = ref('dashboard');
const courts = ref<Court[]>([]);
const coaches = ref<Coach[]>([]);
const members = ref<MemberCard[]>([]);
const selectedBookingId = ref<number | null>(null);
const showBookingModal = ref(false);

const roleName = computed(() => {
  const map: Record<RoleType, string> = {
    reception: '场馆前台',
    coach: '教练',
    manager: '值班店长',
  };
  return map[currentRole.value];
});

const loadBaseData = async () => {
  courts.value = await api.getCourts();
  coaches.value = await api.getCoaches();
  members.value = await api.getMembers();
};

const handleTodoClick = (id: number) => {
  selectedBookingId.value = id;
  showBookingModal.value = true;
};

const handleBookingClick = (id: number) => {
  selectedBookingId.value = id;
  showBookingModal.value = true;
};

const refreshData = () => {
  loadBaseData();
};

onMounted(() => {
  loadBaseData();
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
        <select v-model="currentRole" @change="refreshData">
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
          :role="currentRole"
          @todo-click="handleTodoClick"
        />

        <BookingList
          v-if="currentPage === 'bookings'"
          :role="currentRole"
          :courts="courts"
          :coaches="coaches"
          :members="members"
          @row-click="handleBookingClick"
          @refresh="refreshData"
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
      :role="currentRole"
      :courts="courts"
      :coaches="coaches"
      :members="members"
      @close="showBookingModal = false"
      @refresh="refreshData"
    />
  </div>
</template>
