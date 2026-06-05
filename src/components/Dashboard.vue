<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { RoleType, TodoList } from '../types';
import { api } from '../api';

const props = defineProps<{
  role: RoleType;
}>();

const emit = defineEmits<{
  (e: 'todo-click', id: number): void;
}>();

const todos = ref<TodoList | null>(null);
const loading = ref(false);

const loadTodos = async () => {
  loading.value = true;
  try {
    todos.value = await api.getTodos(props.role);
  } finally {
    loading.value = false;
  }
};

watch(() => props.role, () => {
  loadTodos();
});

onMounted(() => {
  loadTodos();
});
</script>

<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">今日预约</div>
        <div class="value primary">{{ todos?.today_count || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待办事项</div>
        <div class="value warning">{{ (todos?.pending.length || 0) + (todos?.in_progress.length || 0) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待处理</div>
        <div class="value danger">{{ todos?.pending.length || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">处理中</div>
        <div class="value success">{{ todos?.in_progress.length || 0 }}</div>
      </div>
    </div>

    <div v-if="todos?.in_progress.length" class="todo-section">
      <h4>
        <span>⚠️ 需要关注</span>
        <span class="badge">{{ todos.in_progress.length }}</span>
      </h4>
      <div class="todo-list">
        <div
          v-for="item in todos.in_progress"
          :key="item.id"
          class="todo-item"
          :class="item.priority"
          @click="emit('todo-click', item.id)"
        >
          <div class="title">{{ item.title }}</div>
          <div class="desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>

    <div v-if="todos?.pending.length" class="todo-section">
      <h4>
        <span>📋 待办事项</span>
        <span class="badge">{{ todos.pending.length }}</span>
      </h4>
      <div class="todo-list">
        <div
          v-for="item in todos.pending"
          :key="item.id"
          class="todo-item"
          :class="item.priority"
          @click="emit('todo-click', item.id)"
        >
          <div class="title">{{ item.title }}</div>
          <div class="desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>

    <div v-if="!loading && (!todos?.pending.length && !todos?.in_progress.length)" class="empty-state">
      <div class="icon">🎉</div>
      <div class="text">暂无待办事项，继续保持！</div>
    </div>
  </div>
</template>
