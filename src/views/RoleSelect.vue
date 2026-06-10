<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'
import type { Role } from '@/types'

const router = useRouter()
const reportStore = useReportStore()

function selectRole(role: Role) {
  reportStore.setRole(role)
  localStorage.setItem('current_role', role)
  router.push({ name: role })
}
</script>

<template>
  <div class="role-select-page">
    <div class="role-select-container">
      <div class="header">
        <h1 class="title">蛋鸡养殖场</h1>
        <p class="subtitle">疫病上报与隔离处理系统</p>
      </div>

      <div class="role-cards">
        <div class="role-card" @click="selectRole('feeder')">
          <div class="role-icon">🐔</div>
          <div class="role-name">饲养员</div>
          <div class="role-desc">日常巡查，疫病上报</div>
        </div>

        <div class="role-card" @click="selectRole('sorter')">
          <div class="role-icon">🥚</div>
          <div class="role-name">分拣员</div>
          <div class="role-desc">蛋品检测，问题上报</div>
        </div>

        <div class="role-card manager" @click="selectRole('manager')">
          <div class="role-icon">👨‍🌾</div>
          <div class="role-name">场长</div>
          <div class="role-desc">审核处置，隔离管理</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.role-select-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2D5A27 0%, #4A7A45 100%);
  padding: 24px;
}

.role-select-container {
  max-width: 900px;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 48px;
}

.title {
  font-size: 42px;
  font-weight: 700;
  color: white;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 18px;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.role-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.role-card {
  background: white;
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}

.role-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.role-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.role-desc {
  font-size: 14px;
  color: var(--color-text-light);
}

.role-card.manager {
  background: linear-gradient(135deg, #F5F0E6 0%, #E8E0D0 100%);
  border: 2px solid var(--color-primary);
}

@media (max-width: 768px) {
  .role-cards {
    grid-template-columns: 1fr;
  }

  .title {
    font-size: 32px;
  }
}
</style>
