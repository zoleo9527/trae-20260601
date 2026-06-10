<script setup lang="ts">
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { useRouter } from 'vue-router'
import { ElCard, ElRow, ElCol, ElStatistic, ElTable, ElTableColumn, ElTag, ElButton, ElProgress } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()
const router = useRouter()

const stats = computed(() => [
  {
    title: '母猪总数',
    value: store.sows.length,
    icon: 'Pig',
    color: 'primary',
    detail: `${store.sows.filter(s => s.status === 'empty').length} 头待配种`
  },
  {
    title: '公猪总数',
    value: store.boars.length,
    icon: 'Pig',
    color: 'success',
    detail: `${store.boars.filter(b => b.status === 'active').length} 头可用`
  },
  {
    title: '待执行配种计划',
    value: store.pendingPlans.length,
    icon: 'Calendar',
    color: 'warning',
    detail: '需要及时处理'
  },
  {
    title: '未读通知',
    value: store.unreadNotifications.length,
    icon: 'AlertTriangle',
    color: 'danger',
    detail: '请及时查看'
  }
])

const recentPlans = computed(() => {
  return store.breedingPlans
    .filter(p => p.status === 'pending')
    .slice(0, 5)
    .map(plan => ({
      ...plan,
      sow: store.getSowById(plan.sowId),
      boar: store.getBoarById(plan.boarId)
    }))
})

const sowStatusStats = computed(() => {
  const total = store.sows.length
  return {
    pregnant: Math.round((store.sows.filter(s => s.status === 'pregnant').length / total) * 100),
    lactating: Math.round((store.sows.filter(s => s.status === 'lactating').length / total) * 100),
    empty: Math.round((store.sows.filter(s => s.status === 'empty').length / total) * 100),
    weaning: Math.round((store.sows.filter(s => s.status === 'weaning').length / total) * 100),
    culled: Math.round((store.sows.filter(s => s.status === 'culled').length / total) * 100)
  }
})

const currentUserTasks = computed(() => {
  return store.getTasksForRole(store.currentUser.role)
})

const roleLabels: Record<string, string> = {
  breeder: '繁育员',
  veterinarian: '兽医',
  manager: '场长'
}

const planStatusMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  pending: { label: '待执行', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  overdue: { label: '已过期', type: 'info' }
}

const breedingTypeMap: Record<string, string> = {
  natural: '自然配种',
  artificial: '人工授精'
}

function handleTaskAction(task: { id: string; type: string }) {
  switch (task.type) {
    case 'breeding':
      router.push('/breeding-plan')
      break
    case 'conception':
      router.push('/breeding-record')
      break
    case 'vaccine':
      router.push('/vaccine')
      break
    case 'health':
      router.push('/sow-archive')
      break
    case 'exception':
      router.push('/breeding-plan')
      break
    case 'overdue':
      router.push('/breeding-plan')
      break
  }
}

function handleVaccineException(task: { id: string }) {
  store.handleVaccineException(task.id, 'resolve')
  ElMessage.success('疫苗异常已处理')
}

function handlePlanException(task: { id: string }, action: 'ignore' | 'reschedule') {
  store.handlePlanException(task.id, action)
  ElMessage.success(action === 'ignore' ? '异常已标记为处理' : '计划已重新安排')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-800">欢迎回来，{{ store.currentUser.name }}</h2>
      <p class="text-gray-500">今天是 {{ new Date().toLocaleDateString('zh-CN') }} · 当前角色：{{ roleLabels[store.currentUser.role] }}</p>
    </div>

    <ElRow :gutter="16">
      <ElCol v-for="stat in stats" :key="stat.title" :span="6">
        <ElCard class="h-full">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">{{ stat.title }}</p>
              <ElStatistic :value="stat.value" class="mt-2" />
              <p class="text-gray-400 text-xs mt-1">{{ stat.detail }}</p>
            </div>
            <div :class="`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`">
              <component :is="stat.icon" :class="`text-${stat.color}`" :size="24" />
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard title="我的待办任务" v-if="currentUserTasks.length > 0">
      <div class="max-h-64 overflow-y-auto">
        <div class="space-y-2">
          <div
            v-for="task in currentUserTasks"
            :key="task.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div>
              <div class="flex items-center gap-2">
                <ElTag :type="task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'" size="small">
                  {{ task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '中等' : '低' }}
                </ElTag>
                <span class="font-medium">{{ task.title }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ task.description }}</p>
            </div>
            <div class="flex gap-2">
              <template v-if="task.type === 'exception'">
                <ElButton size="small" type="primary" @click="handlePlanException(task, 'reschedule')">重新安排</ElButton>
                <ElButton size="small" @click="handlePlanException(task, 'ignore')">忽略</ElButton>
              </template>
              <template v-else-if="task.type === 'vaccine'">
                <ElButton size="small" type="success" @click="handleVaccineException(task)">处理异常</ElButton>
              </template>
              <template v-else>
                <ElButton size="small" @click="handleTaskAction(task)">处理</ElButton>
              </template>
            </div>
          </div>
        </div>
      </div>
    </ElCard>

    <ElRow :gutter="16">
      <ElCol :span="14">
        <ElCard title="待执行配种计划">
          <ElTable :data="recentPlans" border>
            <ElTableColumn prop="plannedDate" label="计划日期" />
            <ElTableColumn label="母猪">
              <template #default="scope">
                {{ scope.row.sow?.earTag || '未知' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="公猪">
              <template #default="scope">
                {{ scope.row.boar?.earTag || '未知' }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="type" label="配种方式">
              <template #default="scope">
                {{ breedingTypeMap[scope.row.type] }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="status" label="状态">
              <template #default="scope">
                <ElTag :type="planStatusMap[scope.row.status].type">
                  {{ planStatusMap[scope.row.status].label }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作">
              <template #default>
                <ElButton size="small" @click="router.push('/breeding-plan')">查看详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <div class="text-center mt-4">
            <ElButton text @click="router.push('/breeding-plan')">
              查看全部配种计划
              <component is="ChevronRight" :size="16" />
            </ElButton>
          </div>
        </ElCard>
      </ElCol>

      <ElCol :span="10">
        <ElCard title="母猪状态分布">
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">怀孕中</span>
                <span class="text-sm text-gray-500">{{ sowStatusStats.pregnant }}%</span>
              </div>
              <ElProgress :percentage="sowStatusStats.pregnant" color="#409EFF" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">泌乳中</span>
                <span class="text-sm text-gray-500">{{ sowStatusStats.lactating }}%</span>
              </div>
              <ElProgress :percentage="sowStatusStats.lactating" color="#67C23A" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">待配种</span>
                <span class="text-sm text-gray-500">{{ sowStatusStats.empty }}%</span>
              </div>
              <ElProgress :percentage="sowStatusStats.empty" color="#E6A23C" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">断奶期</span>
                <span class="text-sm text-gray-500">{{ sowStatusStats.weaning }}%</span>
              </div>
              <ElProgress :percentage="sowStatusStats.weaning" color="#909399" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">已淘汰</span>
                <span class="text-sm text-gray-500">{{ sowStatusStats.culled }}%</span>
              </div>
              <ElProgress :percentage="sowStatusStats.culled" color="#F56C6C" />
            </div>
          </div>
        </ElCard>

        <ElCard title="近期配种记录" class="mt-4">
          <div v-for="record in store.breedingRecords.slice(0, 3)" :key="record.id" class="flex justify-between items-center py-2 border-b last:border-b-0">
            <div>
              <p class="font-medium">
                {{ store.getSowById(record.sowId)?.earTag }} × {{ store.getBoarById(record.boarId)?.earTag }}
              </p>
              <p class="text-sm text-gray-500">{{ record.breedingDate }} · {{ record.result === 'success' ? '配种成功' : record.result === 'failed' ? '配种失败' : '待确认' }}</p>
            </div>
          </div>
          <div class="text-center mt-2">
            <ElButton text @click="router.push('/breeding-record')">查看全部</ElButton>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<style scoped>
</style>
