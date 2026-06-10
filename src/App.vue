<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from './store'
import PressureBar from './components/PressureBar.vue'
import RoleTodoList from './components/RoleTodoList.vue'
import RecordTable from './components/RecordTable.vue'
import RecordDetail from './components/RecordDetail.vue'
import type { Role } from './types'
import { ROLE_LABELS } from './types'

const { state, setRole, selectRecord, getSelectedRecord, resetData } = useStore()

const roles: Role[] = ['feeder', 'sorter', 'manager']
const activeTab = ref<'todos' | 'records'>('todos')

const selectedRecord = computed(() => getSelectedRecord())

const showResetConfirm = ref(false)

function onRecordClick(id: string) {
  selectRecord(id)
}

function onDetailClose() {
  selectRecord(null)
}

function onReset() {
  resetData()
  showResetConfirm.value = false
}
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">蛋鸡养殖场 · 饲料投喂与耗用分析</h1>
        <span class="header-date">{{ new Date().toLocaleDateString('zh-CN') }}</span>
      </div>
      <div class="header-right">
        <div class="role-switcher">
          <button
            v-for="role in roles"
            :key="role"
            :class="['role-btn', { active: state.currentRole === role }]"
            @click="setRole(role)"
          >
            {{ ROLE_LABELS[role] }}
          </button>
        </div>
        <button class="reset-btn" @click="showResetConfirm = true">重置数据</button>
      </div>
    </header>

    <PressureBar />

    <div class="app-body">
      <nav class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'todos' }]"
          @click="activeTab = 'todos'"
        >
          我的待办
          <span v-if="state.todos.filter(t => !t.done && t.role === state.currentRole).length" class="tab-badge">
            {{ state.todos.filter(t => !t.done && t.role === state.currentRole).length }}
          </span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'records' }]"
          @click="activeTab = 'records'"
        >
          全部记录
        </button>
      </nav>

      <RoleTodoList v-if="activeTab === 'todos'" @select-record="onRecordClick" />
      <RecordTable v-if="activeTab === 'records'" @select-record="onRecordClick" />
    </div>

    <Teleport to="body">
      <div v-if="selectedRecord" class="modal-overlay" @click.self="onDetailClose">
        <RecordDetail :record="selectedRecord" @close="onDetailClose" />
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
        <div class="confirm-dialog">
          <h3>确认重置</h3>
          <p>将所有数据恢复到初始状态，当前操作不可撤销。</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showResetConfirm = false">取消</button>
            <button class="btn-danger" @click="onReset">确认重置</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #1a1a2e;
  color: #fff;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
}

.header-date {
  font-size: 13px;
  color: #8899aa;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-switcher {
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #3a3a5c;
}

.role-btn {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: #8899aa;
  cursor: pointer;
  transition: all 0.2s;
}

.role-btn:hover {
  background: #2a2a4a;
  color: #ccc;
}

.role-btn.active {
  background: #e74c3c;
  color: #fff;
  font-weight: 600;
}

.reset-btn {
  padding: 6px 14px;
  font-size: 12px;
  border: 1px solid #555;
  background: transparent;
  color: #aaa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  gap: 12px;
  overflow: auto;
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #ddd;
}

.tab-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  color: #e74c3c;
  font-weight: 700;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e74c3c;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  font-weight: 700;
  background: #e74c3c;
  color: #fff;
  border-radius: 9px;
  margin-left: 6px;
  padding: 0 5px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-dialog h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #1a1a2e;
}

.confirm-dialog p {
  margin: 0 0 24px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-danger {
  padding: 8px 20px;
  border: none;
  background: #e74c3c;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.btn-danger:hover {
  background: #c0392b;
}
</style>
