<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Role, AccountingTask, ReviewRecord, ActivityItem, TaskStatus } from '~/types'
import { RoleMeta } from '~/types'
import { mockTasks, mockRisks, mockActivities, mockDeadlines } from '~/data/mock'
import StatusTag from '~/components/StatusTag.vue'
import RoleSwitcher from '~/components/RoleSwitcher.vue'
import StatCard from '~/components/StatCard.vue'
import TaskTable from '~/components/TaskTable.vue'
import ReviewDrawer from '~/components/ReviewDrawer.vue'
import SidePanel from '~/components/SidePanel.vue'

const currentRole = ref<Role>('accountant')
const activeMenu = ref('todo')
const selectedTaskIds = ref<string[]>([])
const drawerVisible = ref(false)
const selectedTaskId = ref<string | null>(null)
const toast = ref<{ msg: string; type: string } | null>(null)
let nextRecordId = 100
let nextActivityId = 100

const tasks = ref(mockTasks)
const risks = ref(mockRisks)
const activities = ref(mockActivities)
const deadlines = ref(mockDeadlines)

const selectedTask = computed(() => {
  if (!selectedTaskId.value) return null
  return tasks.value.find(t => t.id === selectedTaskId.value) || null
})

const userInfo: Record<Role, { name: string; avatar: string }> = {
  accountant: { name: '李明', avatar: '李' },
  manager: { name: '王芳', avatar: '王' },
  supervisor: { name: '张伟', avatar: '张' }
}

const now = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const statusTransitionMap: Record<string, { nextStatus: TaskStatus; nextHandler: (task: AccountingTask) => string; recordAction: ReviewRecord['action']; comment: string; activityAction: string; activityTarget: string }> = {
  start_accounting: {
    nextStatus: 'accounting',
    nextHandler: (t) => t.customer.accountant,
    recordAction: 'start_accounting',
    comment: '开始账务处理，进入凭证录入阶段',
    activityAction: '开始记账',
    activityTarget: '开始账务处理'
  },
  submit_review: {
    nextStatus: 'pending_review',
    nextHandler: (t) => t.customer.reviewer,
    recordAction: 'submit',
    comment: '凭证录入完成，提交复核',
    activityAction: '提交凭证复核',
    activityTarget: `${0}张凭证` // will be replaced
  },
  fix_done: {
    nextStatus: 'pending_review',
    nextHandler: (t) => t.customer.reviewer,
    recordAction: 'submit',
    comment: '修正完成，重新提交复核',
    activityAction: '修正后重新提交',
    activityTarget: '修正后重新提交复核'
  },
  start_review: {
    nextStatus: 'reviewing',
    nextHandler: (t) => t.customer.reviewer,
    recordAction: 'start_review',
    comment: '开始复核凭证',
    activityAction: '开始复核',
    activityTarget: '开始凭证复核'
  },
  pass: {
    nextStatus: 'review_pass',
    nextHandler: (t) => t.customer.accountManager,
    recordAction: 'pass',
    comment: '复核通过',
    activityAction: '复核通过',
    activityTarget: '凭证复核通过'
  },
  reject: {
    nextStatus: 'review_reject',
    nextHandler: (t) => t.customer.accountant,
    recordAction: 'reject',
    comment: '凭证复核驳回，请修正后重新提交',
    activityAction: '驳回复核',
    activityTarget: '凭证复核驳回'
  },
  complete: {
    nextStatus: 'completed',
    nextHandler: () => '-',
    recordAction: 'complete',
    comment: '已完成归档',
    activityAction: '完成归档',
    activityTarget: '任务完成归档'
  },
  submit_bill: {
    nextStatus: 'pending_accounting',
    nextHandler: (t) => t.customer.accountant,
    recordAction: 'submit_bill',
    comment: '客户票据已收齐全，提交记账',
    activityAction: '票据就绪',
    activityTarget: '标记票据已齐全'
  },
  remind_bill: {
    nextStatus: 'pending_bill',
    nextHandler: (t) => t.customer.accountManager,
    recordAction: 'remind',
    comment: '已催交客户票据',
    activityAction: '催交票据',
    activityTarget: '催交票据通知'
  },
  communicate: {
    nextStatus: null as unknown as TaskStatus,
    nextHandler: (t) => t.currentHandler,
    recordAction: 'communicate',
    comment: '与相关方进行了沟通',
    activityAction: '沟通记录',
    activityTarget: '添加沟通记录'
  },
  ask_manager: {
    nextStatus: null as unknown as TaskStatus,
    nextHandler: (t) => t.currentHandler,
    recordAction: 'communicate',
    comment: '联系客户经理沟通问题',
    activityAction: '联系客户经理',
    activityTarget: '请求客户经理协助'
  },
  contact_client: {
    nextStatus: null as unknown as TaskStatus,
    nextHandler: (t) => t.currentHandler,
    recordAction: 'communicate',
    comment: '联系客户沟通相关事宜',
    activityAction: '联系客户',
    activityTarget: '与客户沟通'
  }
}

const executeAction = (action: string, task: AccountingTask) => {
  const transition = statusTransitionMap[action]
  if (!transition) {
    toast.value = { msg: `未知操作: ${action}`, type: 'warning' }
    setTimeout(() => { toast.value = null }, 2800)
    return
  }

  const idx = tasks.value.findIndex(t => t.id === task.id)
  if (idx === -1) return

  const t = tasks.value[idx]
  const userName = userInfo[currentRole.value].name
  const role = currentRole.value
  const timestamp = now()

  const record: ReviewRecord = {
    id: `r${nextRecordId++}`,
    reviewer: userName,
    role,
    action: transition.recordAction,
    at: timestamp,
    comment: transition.comment
  }

  if (action === 'reject') {
    record.issues = [
      { field: '综合复核', description: '凭证存在需要修正的问题，请核实后重新提交', severity: 'warning' }
    ]
  }

  if (action === 'submit_review') {
    record.comment = `凭证录入完成，共${t.vouchers.length}张，提交复核`
  }

  t.reviewRecords = [...t.reviewRecords, record]

  if (transition.nextStatus) {
    t.status = transition.nextStatus
    t.currentHandler = transition.nextHandler(t)
  }

  if (t.status === 'completed') {
    t.overdue = false
    t.hasRisk = false
    t.riskNote = undefined
    risks.value = risks.value.filter(r => r.relatedTaskId !== t.id)
  }

  if (t.status === 'review_pass') {
    t.hasRisk = false
    t.riskNote = undefined
    risks.value = risks.value.filter(r => r.relatedTaskId !== t.id)
  }

  if (action === 'remind_bill' || action === 'submit_bill') {
    const riskIdx = risks.value.findIndex(r => r.relatedTaskId === t.id && r.type === 'missing_bill')
    if (riskIdx !== -1) {
      if (action === 'submit_bill') {
        risks.value.splice(riskIdx, 1)
        const remainingRisks = risks.value.filter(r => r.relatedTaskId === t.id)
        if (remainingRisks.length === 0) {
          t.hasRisk = false
          t.riskNote = undefined
        } else if (t.riskNote?.includes('缺票') || t.riskNote?.includes('票据不足')) {
          t.riskNote = remainingRisks.map(r => r.description).join('；')
        }
      } else {
        risks.value[riskIdx].updatedAt = timestamp
      }
    } else if (action === 'submit_bill') {
      const remainingRisks = risks.value.filter(r => r.relatedTaskId === t.id)
      if (remainingRisks.length === 0) {
        t.hasRisk = false
        t.riskNote = undefined
      }
    }
  }

  const activityTarget = action === 'submit_review'
    ? `${t.vouchers.length}张凭证`
    : transition.activityTarget

  const activity: ActivityItem = {
    id: `a${nextActivityId++}`,
    user: userName,
    role,
    action: transition.activityAction,
    customerName: t.customer.name,
    target: activityTarget,
    at: timestamp
  }
  activities.value = [activity, ...activities.value]

  const toastMessages: Record<string, string> = {
    start_accounting: `【${t.customer.name}】已开始账务处理`,
    submit_review: `【${t.customer.name}】${t.vouchers.length}张凭证已提交复核`,
    fix_done: `【${t.customer.name}】修正完成，已重新提交复核`,
    start_review: `【${t.customer.name}】开始复核凭证`,
    pass: `【${t.customer.name}】复核通过`,
    reject: `【${t.customer.name}】凭证已驳回`,
    complete: `【${t.customer.name}】已完成归档`,
    submit_bill: `【${t.customer.name}】票据已标记齐全，流转至记账会计`,
    remind_bill: `已向【${t.customer.name}】催交票据`,
    communicate: `已记录与【${t.customer.name}】的沟通`,
    ask_manager: `已联系客户经理协助【${t.customer.name}】`,
    contact_client: `已联系【${t.customer.name}】客户`
  }

  const toastType = ['reject'].includes(action) ? 'warning' :
    ['remind_bill', 'start_accounting', 'start_review'].includes(action) ? 'info' : 'success'

  toast.value = { msg: toastMessages[action] || `操作成功`, type: toastType }
  setTimeout(() => { toast.value = null }, 2800)
}

const handleBatchAction = (action: string, taskIds: string[]) => {
  if (action === 'export') {
    toast.value = { msg: `已导出 ${taskIds.length} 条任务数据`, type: 'info' }
    setTimeout(() => { toast.value = null }, 2800)
    return
  }

  let singleAction: string
  if (action === 'batch_pass') singleAction = 'pass'
  else if (action === 'batch_remind') singleAction = 'remind_bill'
  else if (action === 'batch_submit_review') singleAction = 'submit_review'
  else return

  let count = 0
  for (const id of taskIds) {
    const t = tasks.value.find(x => x.id === id)
    if (!t) continue
    if (singleAction === 'pass' && !['pending_review', 'reviewing'].includes(t.status)) continue
    if (singleAction === 'submit_review' && t.status !== 'accounting') continue
    if (singleAction === 'remind_bill' && t.status !== 'pending_bill') continue
    executeAction(singleAction, t)
    count++
  }

  selectedTaskIds.value = []
  toast.value = { msg: `批量操作完成，共处理 ${count} 条任务`, type: count > 0 ? 'success' : 'warning' }
  setTimeout(() => { toast.value = null }, 2800)
}

const roleStats = computed(() => {
  const list = tasks.value
  const base = {
    todo: 0,
    processing: 0,
    risk: 0,
    overdue: 0,
    done: 0
  }
  if (currentRole.value === 'accountant') {
    base.todo = list.filter(t => ['pending_accounting', 'review_reject'].includes(t.status)).length
    base.processing = list.filter(t => t.status === 'accounting').length
    base.risk = list.filter(t => t.hasRisk && ['pending_accounting', 'accounting', 'review_reject'].includes(t.status)).length
    base.overdue = list.filter(t => t.overdue).length
    base.done = list.filter(t => ['review_pass', 'completed'].includes(t.status)).length
  } else if (currentRole.value === 'manager') {
    base.todo = list.filter(t => t.status === 'pending_bill').length
    base.processing = list.filter(t => ['pending_accounting', 'accounting'].includes(t.status)).length
    base.risk = list.filter(t => t.hasRisk).length
    base.overdue = list.filter(t => t.overdue).length
    base.done = list.filter(t => t.status === 'completed').length
  } else {
    base.todo = list.filter(t => ['pending_review', 'reviewing'].includes(t.status)).length
    base.processing = list.filter(t => ['pending_accounting', 'accounting'].includes(t.status)).length
    base.risk = risks.value.filter(r => r.level === 'high').length
    base.overdue = list.filter(t => t.overdue).length
    base.done = list.filter(t => ['review_pass', 'completed'].includes(t.status)).length
  }
  return base
})

const roleMenusComputed = computed(() => {
  const list = tasks.value
  if (currentRole.value === 'accountant') {
    const todo = list.filter(t => ['pending_accounting', 'accounting', 'review_reject'].includes(t.status)).length
    const accounting = list.filter(t => ['pending_accounting', 'accounting'].includes(t.status)).length
    const rework = list.filter(t => t.status === 'review_reject').length
    const done = list.filter(t => ['review_pass', 'completed'].includes(t.status)).length
    return [
      { key: 'todo', label: '我的待办', badge: todo > 0 ? String(todo) : undefined, badgeType: 'danger' as const },
      { key: 'accounting', label: '账务处理', badge: accounting > 0 ? String(accounting) : undefined, badgeType: 'warning' as const },
      { key: 'rework', label: '驳回修正', badge: rework > 0 ? String(rework) : undefined, badgeType: 'danger' as const },
      { key: 'completed', label: '本月完成', badge: done > 0 ? String(done) : undefined }
    ]
  }
  if (currentRole.value === 'manager') {
    const todo = list.filter(t => ['pending_bill', 'review_reject'].includes(t.status) || t.hasRisk).length
    const billCollect = list.filter(t => t.status === 'pending_bill' || (t.hasRisk && t.status === 'pending_bill')).length
    const upload = list.filter(t => t.status === 'pending_bill').length
    return [
      { key: 'todo', label: '我的待办', badge: todo > 0 ? String(todo) : undefined, badgeType: 'danger' as const },
      { key: 'bill_collect', label: '票据催收', badge: billCollect > 0 ? String(billCollect) : undefined, badgeType: 'warning' as const },
      { key: 'upload', label: '票据录入', badge: upload > 0 ? String(upload) : undefined, badgeType: 'info' as const },
      { key: 'communicate', label: '客户沟通' }
    ]
  }
  const todo = list.filter(t => ['pending_review', 'reviewing', 'review_reject'].includes(t.status)).length
  const review = list.filter(t => ['pending_review', 'reviewing'].includes(t.status)).length
  const riskCount = risks.value.filter(r => r.level === 'high').length
  return [
    { key: 'todo', label: '我的待办', badge: todo > 0 ? String(todo) : undefined, badgeType: 'danger' as const },
    { key: 'review', label: '凭证复核', badge: review > 0 ? String(review) : undefined, badgeType: 'warning' as const },
    { key: 'risk', label: '风险监控', badge: riskCount > 0 ? String(riskCount) : undefined, badgeType: 'danger' as const },
    { key: 'report', label: '月报汇总' }
  ]
})

const todayTodoList = computed(() => {
  const r = currentRole.value
  const list = tasks.value
  if (r === 'accountant') {
    const items: { time: string; title: string; tag: string; taskId: string; tone: string; desc: string }[] = []
    const rejectTasks = list.filter(t => t.status === 'review_reject')
    for (const t of rejectTasks.slice(0, 2)) {
      items.push({ time: '优先', title: `修正${t.customer.name.slice(0, 6)}凭证`, tag: '驳回修正', taskId: t.id, tone: 'danger', desc: `有${t.reviewRecords.flatMap(r => r.issues || []).length}项问题待修正` })
    }
    const pendingTasks = list.filter(t => t.status === 'pending_accounting')
    for (const t of pendingTasks.slice(0, 2)) {
      items.push({ time: '今日', title: `完成${t.customer.name.slice(0, 6)}账务处理`, tag: '待记账', taskId: t.id, tone: 'warning', desc: t.hasRisk ? (t.riskNote || '含风险项') : '票据已收齐' })
    }
    const accountingTasks = list.filter(t => t.status === 'accounting')
    for (const t of accountingTasks.slice(0, 1)) {
      items.push({ time: '进行中', title: `继续处理${t.customer.name.slice(0, 6)}凭证`, tag: '进行中', taskId: t.id, tone: 'info', desc: `已完成${t.vouchers.length}张凭证` })
    }
    return items
  }
  if (r === 'manager') {
    const items: { time: string; title: string; tag: string; taskId: string; tone: string; desc: string }[] = []
    const billTasks = list.filter(t => t.status === 'pending_bill')
    for (const t of billTasks.slice(0, 2)) {
      items.push({ time: '优先', title: `催交${t.customer.name.slice(0, 6)}票据`, tag: '高优先级', taskId: t.id, tone: 'danger', desc: t.hasRisk ? (t.riskNote || '票据严重不足') : '票据待收' })
    }
    const riskTasks = list.filter(t => t.hasRisk && t.status !== 'pending_bill')
    for (const t of riskTasks.slice(0, 2)) {
      items.push({ time: '今日', title: `${t.customer.name.slice(0, 6)}风险沟通`, tag: '风险沟通', taskId: t.id, tone: 'danger', desc: t.riskNote || '需关注' })
    }
    return items
  }
  const items: { time: string; title: string; tag: string; taskId: string; tone: string; desc: string }[] = []
  const overdueTasks = list.filter(t => t.overdue && ['pending_review', 'reviewing'].includes(t.status))
  for (const t of overdueTasks.slice(0, 2)) {
    items.push({ time: '逾期', title: `复核${t.customer.name.slice(0, 6)}凭证`, tag: '已逾期', taskId: t.id, tone: 'danger', desc: `原计划${t.deadline.slice(5)}完成` })
  }
  const reviewTasks = list.filter(t => t.status === 'pending_review' && !t.overdue)
  for (const t of reviewTasks.slice(0, 2)) {
    items.push({ time: '今日', title: `复核${t.customer.name.slice(0, 6)}凭证`, tag: '待复核', taskId: t.id, tone: 'warning', desc: `${t.vouchers.length}张凭证待复核` })
  }
  const rejectTasks = list.filter(t => t.status === 'review_reject')
  for (const t of rejectTasks.slice(0, 1)) {
    items.push({ time: '待确认', title: `审核${t.customer.name.slice(0, 6)}修正`, tag: '再次复核', taskId: t.id, tone: 'primary', desc: '修正后需确认' })
  }
  return items
})

const openDrawer = (task: AccountingTask) => {
  selectedTaskId.value = task.id
  drawerVisible.value = true
}

const openRisk = (id: string) => {
  const t = tasks.value.find(x => x.id === id)
  if (t) openDrawer(t)
}

const openTodo = (taskId: string) => {
  selectedTaskId.value = taskId
  drawerVisible.value = true
}

const handleAction = (action: string, task: AccountingTask) => {
  executeAction(action, task)
}

const closeDrawer = () => {
  drawerVisible.value = false
}
</script>

<template>
  <div class="workbench">
    <!-- 顶部导航 -->
    <header class="top-bar">
      <div class="top-left">
        <div class="logo">
          <span class="logo-icon">账</span>
          <span class="logo-text">代账业务工作台</span>
        </div>
        <div class="date-display">
          <span class="today">2026年6月13日 星期六</span>
          <span class="period-tip">
            <span class="dot" /> 2026年5月账期处理中 · 距申报截止
            <strong>12</strong> 天
          </span>
        </div>
      </div>
      <div class="top-right">
        <RoleSwitcher :current="currentRole" @change="(r: Role) => { currentRole = r; activeMenu = 'todo'; selectedTaskIds = [] }" />
        <div class="divider-v" />
        <button class="icon-btn" title="通知">
          <span class="icon">🔔</span>
          <span class="badge-num">8</span>
        </button>
        <div class="user-info">
          <div class="avatar" :style="{ backgroundColor: currentRole === 'accountant' ? 'var(--color-primary)' : currentRole === 'manager' ? 'var(--color-info)' : 'var(--color-warning)' }">
            {{ userInfo[currentRole].avatar }}
          </div>
          <div class="user-text">
            <div class="user-name">{{ userInfo[currentRole].name }}</div>
            <div class="user-role">{{ RoleMeta[currentRole].label }}</div>
          </div>
        </div>
      </div>
    </header>

    <div class="main-layout">
      <!-- 左侧导航菜单 -->
      <nav class="left-nav">
        <div class="nav-section">
          <div class="nav-section-title">工作导航</div>
          <button
            v-for="m in roleMenusComputed"
            :key="m.key"
            class="nav-item"
            :class="{ active: activeMenu === m.key }"
            @click="activeMenu = m.key"
          >
            <span class="nav-label">{{ m.label }}</span>
            <span
              v-if="m.badge"
              class="nav-badge"
              :class="m.badgeType"
            >{{ m.badge }}</span>
          </button>
        </div>

        <div class="nav-section mt-auto">
          <div class="nav-section-title">快捷入口</div>
          <button class="nav-item subtle">
            <span class="nav-label">📤 批量票据导入</span>
          </button>
          <button class="nav-item subtle">
            <span class="nav-label">📊 税负率分析</span>
          </button>
          <button class="nav-item subtle">
            <span class="nav-label">📋 申报汇总表</span>
          </button>
        </div>
      </nav>

      <!-- 中间主内容 -->
      <main class="main-content">
        <!-- 今日概览卡片 -->
        <section class="stats-row">
          <StatCard
            :title="currentRole === 'accountant' ? '今日待处理' : currentRole === 'manager' ? '待催收票据' : '待复核凭证'"
            :value="roleStats.todo"
            sub="今日截止前需完成"
            tone="primary"
            icon="!"
          />
          <StatCard
            :title="currentRole === 'accountant' ? '记账进行中' : currentRole === 'manager' ? '处理中客户' : '记账进行中'"
            :value="roleStats.processing"
            sub="正在协作处理"
            tone="info"
            icon="↻"
          />
          <StatCard
            title="高风险任务"
            :value="roleStats.risk"
            sub="需优先关注"
            tone="danger"
            icon="⚠"
          />
          <StatCard
            title="已逾期任务"
            :value="roleStats.overdue"
            sub="请立即处理"
            tone="warning"
            icon="⏰"
          />
          <StatCard
            :title="currentRole === 'supervisor' ? '本月已复核' : '本月已完成'"
            :value="roleStats.done"
            sub="保持节奏"
            tone="success"
            icon="✓"
          />
        </section>

        <!-- 今日待办时间线 -->
        <section class="today-todo card">
          <div class="card-head">
            <div>
              <h2 class="card-title">🎯 今日优先处理</h2>
              <p class="card-sub">共 {{ todayTodoList.length }} 项待办，按时间优先级排列</p>
            </div>
            <div class="card-actions">
              <button class="link-btn">查看全部待办</button>
              <button class="primary-link">+ 新建任务</button>
            </div>
          </div>
          <div class="todo-grid">
            <div
              v-for="(item, i) in todayTodoList"
              :key="i"
              class="todo-card"
              :class="'tone-' + item.tone"
              @click="openTodo(item.taskId)"
            >
              <div class="todo-time">
                <span class="clock">🕐</span>
                <strong>{{ item.time }}</strong>
              </div>
              <div class="todo-tag" :class="'tag-' + item.tone">{{ item.tag }}</div>
              <div class="todo-title">{{ item.title }}</div>
              <div class="todo-desc">{{ item.desc }}</div>
              <div class="todo-action">
                立即处理
                <span class="arrow">→</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 任务列表 -->
        <section class="task-section card">
          <div class="card-head">
            <div>
              <h2 class="card-title">
                📒 {{ currentRole === 'accountant' ? '账务处理工作台' : currentRole === 'manager' ? '客户票据跟进' : '凭证复核工作台' }}
              </h2>
              <p class="card-sub">
                <template v-if="currentRole === 'accountant'">
                  选择「开始记账」进入凭证录入，驳回任务会标记红色优先显示
                </template>
                <template v-else-if="currentRole === 'manager'">
                  票据齐全后标记「待记账」，异常客户需优先沟通
                </template>
                <template v-else>
                  批量复核提高效率，驳回需写明具体问题项便于修正
                </template>
              </p>
            </div>
            <div class="filter-tabs">
              <button
                v-for="tab in [
                  { k: 'todo', l: '待我处理', c: roleStats.todo },
                  { k: 'risk', l: '风险优先', c: roleStats.risk },
                  { k: 'all', l: '全部任务', c: tasks.length }
                ]"
                :key="tab.k"
                class="filter-tab"
              >
                {{ tab.l }}
                <span class="tab-count">{{ tab.c }}</span>
              </button>
            </div>
          </div>

          <div class="task-table-container">
            <TaskTable
              :role="currentRole"
              :data="tasks"
              :active-menu="activeMenu"
              v-model:selected-ids="selectedTaskIds"
              @open="openDrawer"
              @action="(task: AccountingTask, action: string) => executeAction(action, task)"
              @batch-action="handleBatchAction"
            />
          </div>
        </section>
      </main>

      <!-- 右侧信息面板 -->
      <SidePanel
        :risks="risks"
        :activities="activities"
        :deadlines="deadlines"
        @open-risk="openRisk"
        @open-activity="(_t: string) => {}"
      />
    </div>

    <!-- 复核抽屉 -->
    <ReviewDrawer
      :visible="drawerVisible"
      :task="selectedTask"
      :role="currentRole"
      @close="closeDrawer"
      @action="handleAction"
    />

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="toast.type"
      >
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'warning' ? '!' : 'ℹ' }}</span>
        <span class="toast-msg">{{ toast.msg }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.workbench {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: var(--shadow-sm);
}
.top-left {
  display: flex;
  align-items: center;
  gap: 28px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.3px;
}
.date-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 22px;
  border-left: 1px solid var(--color-border);
}
.today {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.period-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.period-tip .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-warning);
  animation: blink 1.6s infinite;
}
.period-tip strong {
  color: var(--color-warning);
  font-weight: 700;
  font-size: 13px;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.top-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.divider-v {
  width: 1px;
  height: 26px;
  background-color: var(--color-border);
}
.icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-soft);
  transition: all 0.15s ease;
}
.icon-btn:hover {
  background-color: var(--color-primary-light);
}
.icon-btn .icon {
  font-size: 16px;
}
.badge-num {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  background-color: var(--color-danger);
  color: #fff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  background-color: var(--color-bg-soft);
  transition: all 0.15s ease;
  cursor: pointer;
}
.user-info:hover {
  background-color: var(--color-border);
}
.user-info .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}
.user-role {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* Main layout */
.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 210px 1fr 340px;
  gap: 18px;
  padding: 18px 24px 24px;
  min-height: 0;
}

/* Left nav */
.left-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 10px;
  height: fit-content;
  position: sticky;
  top: 74px;
}
.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 8px 10px 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  width: 100%;
  text-align: left;
}
.nav-item:hover {
  background-color: var(--color-bg-soft);
  color: var(--color-text);
}
.nav-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
.nav-item.subtle {
  color: var(--color-text-muted);
  font-size: 12px;
}
.nav-item.subtle:hover {
  color: var(--color-text-secondary);
}
.nav-badge {
  min-width: 20px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  text-align: center;
  background-color: var(--color-bg-soft);
  color: var(--color-text-secondary);
}
.nav-item.active .nav-badge {
  background-color: var(--color-primary);
  color: #fff;
}
.nav-badge.danger { background-color: var(--color-danger); color: #fff; }
.nav-badge.warning { background-color: var(--color-warning); color: #fff; }
.nav-badge.info { background-color: var(--color-info); color: #fff; }

/* Main content */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

/* Stat cards */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

/* Card common */
.card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--color-border);
  gap: 14px;
  flex-wrap: wrap;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}
.card-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}
.card-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.link-btn {
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}
.link-btn:hover { color: var(--color-primary); }
.primary-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  background-color: var(--color-bg-soft);
  border-radius: 9px;
}
.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 7px;
  transition: all 0.15s ease;
}
.filter-tab:hover { color: var(--color-text); }
.filter-tab:first-child {
  background-color: var(--color-bg-card);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
.tab-count {
  padding: 0 6px;
  font-size: 10px;
  background-color: var(--color-bg-soft);
  border-radius: 8px;
}
.filter-tab:first-child .tab-count {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

/* Today todo */
.todo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 16px 20px 20px;
}
.todo-card {
  position: relative;
  padding: 14px 16px;
  background-color: var(--color-bg-soft);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid var(--color-border-strong);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.todo-card.tone-danger { border-left-color: var(--color-danger); background: linear-gradient(135deg, #fef2f2 0%, #fff 100%); }
.todo-card.tone-warning { border-left-color: var(--color-warning); background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); }
.todo-card.tone-primary { border-left-color: var(--color-primary); background: linear-gradient(135deg, #eff6ff 0%, #fff 100%); }
.todo-card.tone-info { border-left-color: var(--color-info); background: linear-gradient(135deg, #ecfeff 0%, #fff 100%); }

.todo-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.todo-time strong {
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
}
.todo-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  align-self: flex-start;
}
.tag-danger { background-color: var(--color-danger-light); color: var(--color-danger); }
.tag-warning { background-color: var(--color-warning-light); color: var(--color-warning); }
.tag-primary { background-color: var(--color-primary-light); color: var(--color-primary); }
.tag-info { background-color: var(--color-info-light); color: var(--color-info); }

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}
.todo-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.todo-action {
  margin-top: auto;
  padding-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.arrow { transition: transform 0.15s ease; }
.todo-card:hover .arrow { transform: translateX(3px); }

/* Task table */
.task-table-container {
  max-height: 560px;
  overflow: hidden;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  animation: toastIn 0.25s ease;
}
.toast-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.toast.success { border-left: 3px solid var(--color-success); }
.toast.success .toast-icon { background-color: var(--color-success); }
.toast.warning { border-left: 3px solid var(--color-warning); }
.toast.warning .toast-icon { background-color: var(--color-warning); }
.toast.info { border-left: 3px solid var(--color-info); }
.toast.info .toast-icon { background-color: var(--color-info); }

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive */
@media (max-width: 1400px) {
  .main-layout {
    grid-template-columns: 200px 1fr 310px;
  }
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 1100px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .left-nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
