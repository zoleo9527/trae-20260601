import os

BASE_DIR = "/Users/zhangliu/Documents/private/model-test/trae-20260601-7"

empty_vue_content = '''<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  icon?: any
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: Inbox,
  title: '暂无数据',
  description: ''
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
      <component :is="props.icon" class="w-10 h-10 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-slate-500 text-center max-w-sm">{{ description }}</p>
  </div>
</template>
'''

dashboard_vue_content = '''<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  XCircle,
  Wrench,
  CheckCircle2,
  Plus,
  ListTodo,
  FileText,
  AlertTriangle,
  Briefcase,
  HardHat,
  Wrench as WrenchIcon
} from 'lucide-vue-next'
import { useRole } from '@/stores/role'
import type { Role } from '../../../api/types'
import type { OperationLog } from '../../../api/types'
import Timeline from '@/components/Timeline.vue'

const router = useRouter()
const { currentRole, roleName } = useRole()

interface StatsData {
  pendingTests: number
  failedTests: number
  pendingIssues: number
  pendingVerifyIssues: number
  recentActivities: OperationLog[]
}

const stats = ref<StatsData>({
  pendingTests: 0,
  failedTests: 0,
  pendingIssues: 0,
  pendingVerifyIssues: 0,
  recentActivities: []
})
const loading = ref(false)

const statCards = [
  {
    key: 'pendingTests',
    label: '待执行测试',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    path: '/tests'
  },
  {
    key: 'failedTests',
    label: '未通过测试',
    icon: XCircle,
    gradient: 'from-red-500 to-red-600',
    bgGradient: 'from-red-50 to-red-100',
    path: '/tests'
  },
  {
    key: 'pendingIssues',
    label: '待整改问题',
    icon: Wrench,
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'from-amber-50 to-amber-100',
    path: '/issues'
  },
  {
    key: 'pendingVerifyIssues',
    label: '待验证问题',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    path: '/issues'
  }
]

const quickActions = [
  {
    label: '新建联调测试',
    icon: Plus,
    path: '/tests/new',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    label: '查看问题整改列表',
    icon: ListTodo,
    path: '/issues',
    gradient: 'from-amber-500 to-amber-600'
  },
  {
    label: '测试管理',
    icon: FileText,
    path: '/tests',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    label: '问题管理',
    icon: AlertTriangle,
    path: '/issues',
    gradient: 'from-rose-500 to-rose-600'
  }
]

const getRoleIcon = (role: Role | null) => {
  if (!role) return Briefcase
  const icons: Record<Role, any> = {
    pm: Briefcase,
    captain: HardHat,
    engineer: WrenchIcon
  }
  return icons[role] || Briefcase
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

async function fetchStats() {
  loading.value = true
  try {
    const res = await fetch('/api/stats')
    const data = await res.json()
    if (data.success) {
      stats.value = data.data
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

const getStatValue = (key: string) => {
  return (stats.value as any)[key] || 0
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <component :is="getRoleIcon(currentRole)" class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            {{ getGreeting() }}，{{ roleName }}
          </h1>
          <p class="text-slate-500 mt-1">欢迎回到工作台，今天也要加油哦！</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="card in statCards"
        :key="card.key"
        @click="router.push(card.path)"
        class="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md"
            :class="card.gradient"
          >
            <component :is="card.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">
          {{ loading ? '--' : getStatValue(card.key) }}
        </div>
        <div class="text-sm text-slate-500">{{ card.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">快捷入口</h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="action in quickActions"
            :key="action.label"
            @click="router.push(action.path)"
            class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform"
              :class="action.gradient"
            >
              <component :is="action.icon" class="w-5 h-5 text-white" />
            </div>
            <span class="text-sm font-medium text-slate-700">{{ action.label }}</span>
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">近期动态</h2>
        <Timeline :logs="stats.recentActivities" />
      </div>
    </div>
  </div>
</template>
'''

def write_file(filepath: str, content: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"已写入: {filepath}")

if __name__ == "__main__":
    write_file(os.path.join(BASE_DIR, "src/components/Empty.vue"), empty_vue_content)
    write_file(os.path.join(BASE_DIR, "src/pages/Dashboard.vue"), dashboard_vue_content)
    print("\n所有文件写入完成！")
router.put('/:id/progress', (req: Request, res: Response): void => {
  const db = getDb()
  const { description } = req.body

  if (!description) { res.status(400).json({ success: false, error: '\u63cf\u8ff0\u4e3a\u5fc5\u586b\u9879' }); return }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95ee\u9898\u4e0d\u5b58\u5728' }); return }

  const roleInfo = getRoleInfo()
  db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), req.params.id, description, roleInfo.name, 'progress')
  db.prepare(`UPDATE issues SET updated_at = datetime('now') WHERE id = ?`).run(req.params.id)
  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', req.params.id, 'progress', roleInfo.role, roleInfo.name, description)

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  const progresses = db.prepare('SELECT * FROM issue_progresses WHERE issue_id = ? ORDER BY created_at').all(req.params.id)
  res.json({ success: true, data: { ...result, progresses } })
})

router.put('/:id/complete', (req: Request, res: Response): void => {
  const db = getDb()
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95ee\u9898\u4e0d\u5b58\u5728' }); return }

  const roleInfo = getRoleInfo()

  db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now') WHERE id = ?`).run('pending_verify', req.params.id)

  db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), req.params.id, '\u6574\u6539\u5b8c\u6210\uff0c\u5f85\u9a8c\u8bc1', roleInfo.name, 'complete')
  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', req.params.id, 'complete', roleInfo.role, roleInfo.name, '\u6574\u6539\u5b8c\u6210\uff0c\u5f85\u9a8c\u8bc1')

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: result })
})

router.put('/:id/verify', (req: Request, res: Response): void => {
  const db = getDb()
  const { passed, remark } = req.body

  if (passed === undefined) { res.status(400).json({ success: false, error: 'passed\u4e3a\u5fc5\u586b\u9879' }); return }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95ee\u9898\u4e0d\u5b58\u5728' }); return }

  const roleInfo = getRoleInfo()

  if (passed) {
    db.prepare(`UPDATE issues SET status = ?, closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run('closed', req.params.id)
    db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.id, remark || '\u9a8c\u8bc1\u901a\u8fc7\uff0c\u95ee\u9898\u5173\u95ed', roleInfo.name, 'verify')
    db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'issue', req.params.id, 'verify', roleInfo.role, roleInfo.name, remark || '\u9a8c\u8bc1\u901a\u8fc7\uff0c\u95ee\u9898\u5173\u95ed')
  } else {
    db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now') WHERE id = ?`).run('in_progress', req.params.id)
    db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.id, remark || '\u9a8c\u8bc1\u672a\u901a\u8fc7\uff0c\u9700\u8981\u7ee7\u7eed\u6574\u6539', roleInfo.name, 'reject')
    db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'issue', req.params.id, 'reject', roleInfo.role, roleInfo.name, remark || '\u9a8c\u8bc1\u672a\u901a\u8fc7\uff0c\u9700\u8981\u7ee7\u7eed\u6574\u6539')
  }

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  const progresses = db.prepare('SELECT * FROM issue_progresses WHERE issue_id = ? ORDER BY created_at').all(req.params.id)
  res.json({ success: true, data: { ...result, progresses } })
})

export default router
"""

files['stats.ts'] = r"""import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()

  const pendingTests = db.prepare(`SELECT COUNT(*) as count FROM joint_tests WHERE status = ?`).get('pending').count
  const failedTests = db.prepare(`SELECT COUNT(*) as count FROM joint_tests WHERE status = ?`).get('failed').count
  const pendingIssues = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status IN (?, ?)`).get('pending_assign', 'in_progress').count
  const pendingVerifyIssues = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status = ?`).get('pending_verify').count

  const recentLogs = db.prepare('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 10').all()
  const recentActivities = recentLogs.map((log: any) => {
    let entityInfo: any = null
    if (log.entity_type === 'test') {
      const test = db.prepare('SELECT title FROM joint_tests WHERE id = ?').get(log.entity_id)
      entityInfo = test ? { type: 'test', title: test.title } : null
    } else if (log.entity_type === 'issue') {
      const issue = db.prepare('SELECT title FROM issues WHERE id = ?').get(log.entity_id)
      entityInfo = issue ? { type: 'issue', title: issue.title } : null
    }
    return { ...log, entityInfo }
  })

  res.json({ success: true, data: { pendingTests, failedTests, pendingIssues, pendingVerifyIssues, recentActivities } })
})

export default router
"""

for name, content in files.items():
    path = os.path.join(BASE, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Written {name}')
