<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAppointments } from '~/composables/useAppointments'
import { getTodosByRole, getRoleName } from '~/data/mockData'
import type { TodoItem } from '~/data/types'

const emit = defineEmits<{
  navigate: [page: string, targetId?: string]
}>()

const { currentRole, roleName } = useAuth()
const { fetchAppointments, pendingAppointments, getPendingExceptions, getOverdueExceptions } = useAppointments()

onMounted(() => {
  fetchAppointments()
})

const todos = computed<TodoItem[]>(() => {
  if (!currentRole.value) return []
  return getTodosByRole(currentRole.value)
})

const highPriorityTodos = computed(() => todos.value.filter(t => t.priority === 'high'))
const mediumPriorityTodos = computed(() => todos.value.filter(t => t.priority === 'medium'))
const lowPriorityTodos = computed(() => todos.value.filter(t => t.priority === 'low'))

const stats = computed(() => ({
  pending: pendingAppointments.value.length,
  exceptions: getPendingExceptions().length,
  overdue: getOverdueExceptions().length,
  today: todos.value.filter(t => t.dueTime?.startsWith('2024-01-16') || false).length
}))

const priorityLabels: Record<string, string> = {
  high: '紧急',
  medium: '中等',
  low: '一般'
}

const typeIcons: Record<string, string> = {
  appointment: '📅',
  exception: '⚠️',
  task: '📋'
}

const handleTodoClick = (todo: TodoItem) => {
  if (todo.type === 'appointment' && todo.appointmentId) {
    emit('navigate', 'appointments', todo.appointmentId)
  } else if (todo.type === 'exception' && todo.exceptionId) {
    emit('navigate', 'exceptions', todo.exceptionId)
  } else if (todo.type === 'exception' && todo.appointmentId) {
    emit('navigate', 'exceptions', todo.appointmentId)
  } else if (todo.type === 'task') {
    emit('navigate', 'appointments')
  }
}
</script>

<template>
  <div>
    <div class="card" style="margin-bottom: 20px;">
      <h2>欢迎回来，{{ roleName }}</h2>
      <p style="color: #999; margin-top: 4px;">以下是您今天的待办事项</p>
    </div>
    
    <div class="card">
      <div style="display: flex; gap: 24px; margin-bottom: 24px;">
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #4080ff;">{{ stats.pending }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">待确认预约</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #f5222d;">{{ stats.exceptions }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">待处理异常</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #fff7e6; border-radius: 8px; border: 1px solid #faad14;">
          <div style="font-size: 32px; font-weight: 600; color: #faad14;">{{ stats.overdue }}</div>
          <div style="font-size: 14px; color: #faad14; margin-top: 4px;">已逾期</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #52c41a;">{{ stats.today }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">今日待办</div>
        </div>
      </div>
    </div>
    
    <div v-if="highPriorityTodos.length > 0" class="card">
      <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span>🔥</span> 紧急待办
      </h3>
      <div 
        v-for="todo in highPriorityTodos" 
        :key="todo.id"
        class="todo-item"
        @click="handleTodoClick(todo)"
        :style="{ borderLeft: todo.isOverdue ? '4px solid #f5222d' : 'none' }"
      >
        <div class="todo-title" style="display: flex; align-items: center; gap: 8px;">
          <span>{{ typeIcons[todo.type] }}</span>
          {{ todo.title }}
          <span 
            v-if="todo.isOverdue"
            class="badge"
            style="background-color: #fff2f0; color: #f5222d;"
          >
            ⚠️ 逾期
          </span>
          <span 
            v-else
            class="badge" 
            :style="{ backgroundColor: '#fff2f0', color: '#f5222d' }"
          >
            {{ priorityLabels[todo.priority] }}
          </span>
        </div>
        <div class="todo-meta">
          <span>{{ todo.description }}</span>
          <span v-if="todo.dueTime">截止: {{ todo.dueTime }}</span>
          <span v-if="todo.responsibleRole" style="color: #4080ff;">责任: {{ getRoleName(todo.responsibleRole) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="mediumPriorityTodos.length > 0" class="card">
      <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span>📌</span> 中等优先级
      </h3>
      <div 
        v-for="todo in mediumPriorityTodos" 
        :key="todo.id"
        class="todo-item"
        @click="handleTodoClick(todo)"
        :style="{ borderLeft: todo.isOverdue ? '4px solid #faad14' : 'none' }"
      >
        <div class="todo-title" style="display: flex; align-items: center; gap: 8px;">
          <span>{{ typeIcons[todo.type] }}</span>
          {{ todo.title }}
          <span 
            v-if="todo.isOverdue"
            class="badge"
            style="background-color: #fff7e6; color: #faad14;"
          >
            ⚠️ 逾期
          </span>
          <span 
            v-else
            class="badge" 
            :style="{ backgroundColor: '#fff7e6', color: '#d48806' }"
          >
            {{ priorityLabels[todo.priority] }}
          </span>
        </div>
        <div class="todo-meta">
          <span>{{ todo.description }}</span>
          <span v-if="todo.dueTime">截止: {{ todo.dueTime }}</span>
          <span v-if="todo.responsibleRole" style="color: #4080ff;">责任: {{ getRoleName(todo.responsibleRole) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="lowPriorityTodos.length > 0" class="card">
      <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span>📝</span> 一般事项
      </h3>
      <div 
        v-for="todo in lowPriorityTodos" 
        :key="todo.id"
        class="todo-item"
        @click="handleTodoClick(todo)"
      >
        <div class="todo-title" style="display: flex; align-items: center; gap: 8px;">
          <span>{{ typeIcons[todo.type] }}</span>
          {{ todo.title }}
          <span 
            class="badge" 
            :style="{ backgroundColor: '#f6ffed', color: '#52c41a' }"
          >
            {{ priorityLabels[todo.priority] }}
          </span>
        </div>
        <div class="todo-meta">
          <span>{{ todo.description }}</span>
          <span v-if="todo.dueTime">截止: {{ todo.dueTime }}</span>
          <span v-if="todo.responsibleRole" style="color: #4080ff;">责任: {{ getRoleName(todo.responsibleRole) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="todos.length === 0" class="card empty-state">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">暂无待办事项</div>
      <div style="color: #999;">您当前没有需要处理的任务</div>
    </div>
  </div>
</template>