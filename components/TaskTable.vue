<script setup lang="ts">
import { computed } from 'vue'
import type { Role, AccountingTask } from '~/types'
import StatusTag from '~/components/StatusTag.vue'

const props = defineProps<{
  role: Role
  data: AccountingTask[]
  selectedIds: string[]
  activeMenu: string
  topFilter: 'todo' | 'risk' | 'all'
}>()

const emit = defineEmits<{
  'update:selectedIds': [ids: string[]]
  open: [task: AccountingTask]
  action: [task: AccountingTask, action: string]
  batchAction: [action: string, taskIds: string[]]
}>()

const filteredTasks = computed(() => {
  const list = [...props.data]
  let result: AccountingTask[] = []

  if (props.role === 'accountant') {
    if (props.activeMenu === 'accounting') {
      result = list.filter(t => ['pending_accounting', 'accounting', 'review_reject'].includes(t.status))
    } else if (props.activeMenu === 'rework') {
      result = list.filter(t => t.status === 'review_reject')
    } else if (props.activeMenu === 'completed') {
      result = list.filter(t => ['review_pass', 'completed'].includes(t.status))
    } else {
      result = list.filter(t => !['completed', 'review_pass'].includes(t.status))
    }
  } else if (props.role === 'manager') {
    if (props.activeMenu === 'bill_collect') {
      result = list.filter(t => (t.status === 'pending_bill' || t.hasRisk) && !['review_pass', 'completed'].includes(t.status))
    } else if (props.activeMenu === 'upload') {
      result = list.filter(t => ['pending_bill', 'pending_accounting'].includes(t.status))
    } else if (props.activeMenu === 'communicate') {
      result = list.filter(t => !['completed', 'review_pass'].includes(t.status))
    } else {
      result = list.filter(t => !['completed', 'review_pass'].includes(t.status))
    }
  } else {
    if (props.activeMenu === 'review') {
      result = list.filter(t => ['pending_review', 'reviewing'].includes(t.status))
    } else if (props.activeMenu === 'risk') {
      result = list.filter(t => (t.hasRisk || t.overdue) && !['review_pass', 'completed'].includes(t.status))
    } else if (props.activeMenu === 'report') {
      result = list.filter(t => ['review_pass', 'completed'].includes(t.status))
    } else {
      result = list.filter(t => !['completed', 'review_pass'].includes(t.status))
    }
  }

  if (props.topFilter === 'todo') {
    result = result.filter(t => !['review_pass', 'completed'].includes(t.status))
  } else if (props.topFilter === 'risk') {
    result = result.filter(t => (t.hasRisk || t.overdue) && !['review_pass', 'completed'].includes(t.status))
  }

  return result
})

const toggleSelect = (id: string) => {
  const next = props.selectedIds.includes(id)
    ? props.selectedIds.filter(i => i !== id)
    : [...props.selectedIds, id]
  emit('update:selectedIds', next)
}

const toggleAll = () => {
  if (props.selectedIds.length === filteredTasks.value.length) {
    emit('update:selectedIds', [])
  } else {
    emit('update:selectedIds', filteredTasks.value.map(t => t.id))
  }
}

const primaryAction = computed(() => {
  const map: Record<Role, Record<string, { label: string; action: string }>> = {
    accountant: {
      pending_bill: { label: '等待票据', action: '' },
      pending_accounting: { label: '开始记账', action: 'start_accounting' },
      accounting: { label: '继续记账', action: 'open' },
      review_reject: { label: '修正凭证', action: 'fix_done' },
      pending_review: { label: '待复核', action: 'open' },
      reviewing: { label: '复核中', action: 'open' },
      review_pass: { label: '查看报告', action: 'open' },
      completed: { label: '查看详情', action: 'open' }
    },
    manager: {
      pending_bill: { label: '催交票据', action: 'remind_bill' },
      pending_accounting: { label: '查看进度', action: 'open' },
      accounting: { label: '查看进度', action: 'open' },
      review_reject: { label: '同步问题', action: 'communicate' },
      pending_review: { label: '查看进度', action: 'open' },
      reviewing: { label: '查看进度', action: 'open' },
      review_pass: { label: '跟进完成', action: 'open' },
      completed: { label: '查看详情', action: 'open' }
    },
    supervisor: {
      pending_bill: { label: '查看详情', action: 'open' },
      pending_accounting: { label: '查看详情', action: 'open' },
      accounting: { label: '查看详情', action: 'open' },
      review_reject: { label: '查看详情', action: 'open' },
      pending_review: { label: '开始复核', action: 'start_review' },
      reviewing: { label: '继续复核', action: 'open' },
      review_pass: { label: '完成归档', action: 'complete' },
      completed: { label: '查看详情', action: 'open' }
    }
  }
  return map
})

const getActionItem = (task: AccountingTask) => {
  const r = primaryAction.value[props.role]
  return (r && r[task.status]) || { label: '查看详情', action: 'open' }
}
</script>

<template>
  <div class="task-table-wrap">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <label class="checkbox-wrap" @click.stop>
          <input
            type="checkbox"
            :checked="filteredTasks.length > 0 && selectedIds.length === filteredTasks.length"
            :indeterminate="selectedIds.length > 0 && selectedIds.length < filteredTasks.length"
            @change="toggleAll"
          />
          <span v-if="selectedIds.length > 0">已选 {{ selectedIds.length }} 项</span>
          <span v-else>共 {{ filteredTasks.length }} 条</span>
        </label>
      </div>
      <div v-if="selectedIds.length > 0" class="toolbar-actions">
        <button class="batch-btn secondary" @click="emit('batchAction', 'export', selectedIds)">批量导出</button>
        <button v-if="role === 'supervisor'" class="batch-btn primary" @click="emit('batchAction', 'batch_pass', selectedIds)">批量通过</button>
        <button v-if="role === 'manager'" class="batch-btn primary" @click="emit('batchAction', 'batch_remind', selectedIds)">批量催票</button>
        <button v-if="role === 'accountant'" class="batch-btn primary" @click="emit('batchAction', 'batch_submit_review', selectedIds)">批量标记待复核</button>
        <button class="batch-btn ghost" @click="$emit('update:selectedIds', [])">取消选择</button>
      </div>
      <div v-else class="toolbar-right">
        <button class="tool-btn">
          <span>筛选</span>
          <span class="chevron">▾</span>
        </button>
        <button class="tool-btn">排序</button>
      </div>
    </div>

    <div class="table-list">
      <div class="list-header">
        <div class="col-check"></div>
        <div class="col-customer">客户 / 账期</div>
        <div class="col-status">状态</div>
        <div class="col-progress">处理进度</div>
        <div class="col-handler">责任人 / 截止</div>
        <div class="col-issues">问题 / 风险</div>
        <div class="col-action">操作</div>
      </div>

      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="list-row"
        :class="{
          selected: selectedIds.includes(task.id),
          risky: task.hasRisk,
          overdue: task.overdue
        }"
      >
        <div class="col-check">
          <input
            type="checkbox"
            :checked="selectedIds.includes(task.id)"
            @change.stop="toggleSelect(task.id)"
          />
        </div>

        <div class="col-customer" @click="emit('open', task)">
          <div class="customer-main">
            <div class="customer-name">
              <span class="name-text">{{ task.customer.name }}</span>
              <span v-if="task.overdue" class="overdue-tag">逾期</span>
              <span v-else-if="task.hasRisk" class="risk-tag">风险</span>
            </div>
            <div class="customer-meta">
              <span class="period">{{ task.period }} 账期</span>
              <span class="divider">·</span>
              <span>{{ task.customer.scale }}</span>
              <span class="divider">·</span>
              <span>{{ task.customer.industry }}</span>
            </div>
            <div class="customer-tags">
              <span v-for="t in task.customer.tags.slice(0, 2)" :key="t" class="mini-tag">{{ t }}</span>
            </div>
          </div>
        </div>

        <div class="col-status">
          <StatusTag :status="task.status" />
        </div>

        <div class="col-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{
                warn: task.overdue,
                risk: task.hasRisk && !task.overdue
              }"
              :style="{
                width: (() => {
                  const pctMap: Record<string, number> = {
                    pending_bill: 10,
                    pending_accounting: 25,
                    accounting: 55,
                    pending_review: 75,
                    reviewing: 85,
                    review_pass: 95,
                    review_reject: 55,
                    completed: 100
                  }
                  return pctMap[task.status] + '%'
                })()
              }"
            />
          </div>
          <div class="progress-meta">
            <span>票据 {{ task.bills.length }} 组</span>
            <span>凭证 {{ task.vouchers.length }} 张</span>
          </div>
        </div>

        <div class="col-handler">
          <div class="handler-row">
            <span class="handler-name">{{ task.currentHandler }}</span>
            <span class="handler-label">当前处理</span>
          </div>
          <div class="deadline-row" :class="{ overdue: task.overdue }">
            <span class="deadline-icon">⏰</span>
            <span>截止 {{ task.deadline.slice(5) }}</span>
            <span v-if="task.overdue" class="overdue-text">(已逾期)</span>
          </div>
        </div>

        <div class="col-issues">
          <div v-if="task.reviewRecords.some(r => r.issues?.length)" class="issue-item error">
            <span class="issue-icon">⚠</span>
            <span>
              {{ task.reviewRecords.flatMap(r => r.issues || []).length }} 项问题待修正
            </span>
          </div>
          <div v-else-if="task.hasRisk && task.riskNote" class="issue-item warn">
            <span class="issue-icon">!</span>
            <span class="risk-note">{{ task.riskNote }}</span>
          </div>
          <div v-else-if="task.reviewRecords.length > 0" class="issue-item info">
            <span class="issue-icon">↻</span>
            <span>{{ task.reviewRecords.length }} 条处理记录</span>
          </div>
          <div v-else class="issue-item empty">
            <span>暂无</span>
          </div>
        </div>

        <div class="col-action">
          <button
            class="primary-btn"
            @click.stop="getActionItem(task).action === 'open' ? emit('open', task) : emit('action', task, getActionItem(task).action)"
          >
            {{ getActionItem(task).label }}
          </button>
          <button class="ghost-btn" @click.stop="emit('action', task, 'communicate')">沟通</button>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">当前筛选下没有任务</div>
        <div class="empty-sub">试试切换左侧菜单或清除筛选条件</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-table-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-soft);
  gap: 12px;
}
.toolbar-left,
.toolbar-right,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-actions {
  flex: 1;
  justify-content: flex-end;
}
.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}
.checkbox-wrap input[type='checkbox'],
.list-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.tool-btn,
.batch-btn {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 7px;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tool-btn {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.tool-btn:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.chevron {
  font-size: 10px;
  color: var(--color-text-muted);
}
.batch-btn.primary {
  background-color: var(--color-primary);
  color: #fff;
}
.batch-btn.primary:hover { background-color: var(--color-primary-hover); }
.batch-btn.secondary {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.batch-btn.secondary:hover { border-color: var(--color-border-strong); }
.batch-btn.ghost {
  color: var(--color-text-secondary);
}
.batch-btn.ghost:hover { color: var(--color-primary); }

.table-list {
  flex: 1;
  overflow-y: auto;
}
.list-header {
  display: grid;
  grid-template-columns: 40px 2fr 130px 200px 160px 200px 170px;
  align-items: center;
  padding: 12px 18px;
  background-color: var(--color-bg-soft);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.2px;
  position: sticky;
  top: 0;
  z-index: 1;
}
.list-row {
  display: grid;
  grid-template-columns: 40px 2fr 130px 200px 160px 200px 170px;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.15s ease;
  cursor: pointer;
}
.list-row:hover {
  background-color: var(--color-bg-soft);
}
.list-row.selected {
  background-color: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
  padding-left: 15px;
}
.list-row.risky:hover { background-color: #fff7ed; }
.list-row.overdue:hover { background-color: #fef2f2; }

.col-check { display: flex; align-items: center; }

.customer-main { min-width: 0; }
.customer-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.name-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.risk-tag {
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}
.overdue-tag {
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}
.customer-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.divider { color: var(--color-border-strong); }
.customer-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.mini-tag {
  padding: 2px 8px;
  font-size: 11px;
  background-color: var(--color-bg-soft);
  color: var(--color-text-secondary);
  border-radius: 4px;
}

.progress-bar {
  height: 6px;
  background-color: var(--color-bg-soft);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.progress-fill.warn { background-color: var(--color-danger); }
.progress-fill.risk { background-color: var(--color-warning); }
.progress-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.handler-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.handler-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
.handler-label {
  font-size: 11px;
  padding: 1px 6px;
  background-color: var(--color-bg-soft);
  color: var(--color-text-muted);
  border-radius: 4px;
}
.deadline-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.deadline-row.overdue {
  color: var(--color-danger);
  font-weight: 500;
}
.deadline-icon { font-size: 12px; }
.overdue-text { margin-left: 2px; }

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
}
.issue-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}
.issue-item.error { color: var(--color-danger); }
.issue-item.error .issue-icon {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}
.issue-item.warn { color: var(--color-warning); }
.issue-item.warn .issue-icon {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}
.issue-item.info { color: var(--color-info); }
.issue-item.info .issue-icon {
  background-color: var(--color-info-light);
  color: var(--color-info);
}
.issue-item.empty { color: var(--color-text-muted); }
.risk-note {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.col-action {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.primary-btn {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  background-color: var(--color-primary);
  color: #fff;
  border-radius: 7px;
  transition: all 0.15s ease;
}
.primary-btn:hover { background-color: var(--color-primary-hover); }
.ghost-btn {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.15s ease;
}
.ghost-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 14px;
  opacity: 0.6;
}
.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
