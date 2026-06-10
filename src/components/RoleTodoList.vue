<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store'
import { ROLE_LABELS } from '../types'
import type { TodoItem } from '../types'

const emit = defineEmits<{
  'select-record': [id: string]
}>()

const { state } = useStore()

const myTodos = computed(() =>
  state.todos.filter(t => t.role === state.currentRole && !t.done)
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })
)

const doneTodos = computed(() =>
  state.todos.filter(t => t.role === state.currentRole && t.done)
)

function priorityLabel(p: TodoItem['priority']) {
  return { high: '紧急', medium: '一般', low: '低' }[p]
}

function priorityClass(p: TodoItem['priority']) {
  return `priority-${p}`
}
</script>

<template>
  <div class="todo-panel">
    <div v-if="myTodos.length === 0" class="todo-empty">
      <div class="empty-icon">✓</div>
      <div class="empty-text">{{ ROLE_LABELS[state.currentRole] }}当前无待办</div>
    </div>

    <div v-else class="todo-list">
      <div
        v-for="todo in myTodos"
        :key="todo.id"
        class="todo-item"
        @click="emit('select-record', todo.relatedRecordId)"
      >
        <div class="todo-header">
          <span :class="['todo-priority', priorityClass(todo.priority)]">
            {{ priorityLabel(todo.priority) }}
          </span>
          <span class="todo-title">{{ todo.title }}</span>
        </div>
        <div class="todo-desc">{{ todo.description }}</div>
        <div class="todo-meta">
          <span class="todo-time">{{ todo.createdAt }}</span>
          <span class="todo-link">查看详情 →</span>
        </div>
      </div>
    </div>

    <div v-if="doneTodos.length" class="done-section">
      <div class="done-header">已完成 ({{ doneTodos.length }})</div>
      <div v-for="todo in doneTodos" :key="todo.id" class="done-item" @click="emit('select-record', todo.relatedRecordId)">
        <span class="done-check">✓</span>
        <span class="done-title">{{ todo.title }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-panel {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  color: #999;
}

.empty-icon {
  font-size: 40px;
  color: #2ecc71;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
}

.todo-list {
  display: flex;
  flex-direction: column;
}

.todo-item {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
}

.todo-item:hover {
  background: #f8f9fb;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.todo-priority {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.priority-high {
  background: #fde8e8;
  color: #e74c3c;
}

.priority-medium {
  background: #fef3e2;
  color: #e67e22;
}

.priority-low {
  background: #e8f4fd;
  color: #3498db;
}

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.todo-desc {
  font-size: 12px;
  color: #888;
  margin-left: 0;
  padding-left: 56px;
}

.todo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  padding-left: 56px;
}

.todo-time {
  font-size: 11px;
  color: #aaa;
}

.todo-link {
  font-size: 12px;
  color: #3498db;
  font-weight: 500;
}

.done-section {
  border-top: 1px solid #e0e0e0;
  padding: 12px 18px;
}

.done-header {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.done-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  opacity: 0.6;
}

.done-item:hover {
  opacity: 1;
}

.done-check {
  color: #2ecc71;
  font-weight: 700;
  font-size: 13px;
}

.done-title {
  font-size: 13px;
  color: #666;
  text-decoration: line-through;
}
</style>
