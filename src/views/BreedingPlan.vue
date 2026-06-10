<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import type { BreedingPlan } from '@/types'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElDatePicker, ElInput, ElPopconfirm } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const showAddDialog = ref(false)
const showExecuteDialog = ref(false)
const selectedPlan = ref<BreedingPlan | null>(null)

const searchQuery = ref('')
const statusFilter = ref<string>('all')

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

const form = ref({
  sowId: '',
  boarId: '',
  plannedDate: '',
  type: 'natural' as 'natural' | 'artificial',
  reason: '常规配种',
  status: 'pending' as 'pending' | 'completed' | 'cancelled' | 'overdue'
})

const executeForm = ref({
  result: 'success' as 'success' | 'failed',
  notes: ''
})

const filteredPlans = computed(() => {
  return store.breedingPlans.filter(plan => {
    const sow = store.getSowById(plan.sowId)
    const boar = store.getBoarById(plan.boarId)
    const matchesSearch = sow?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         boar?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || plan.status === statusFilter.value
    return matchesSearch && matchesStatus
  }).sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime())
})

const pendingCount = computed(() => store.breedingPlans.filter(p => p.status === 'pending').length)
const completedCount = computed(() => store.breedingPlans.filter(p => p.status === 'completed').length)

function openAddDialog() {
  form.value = {
    sowId: '',
    boarId: '',
    plannedDate: '',
    type: 'natural',
    reason: '常规配种',
    status: 'pending'
  }
  showAddDialog.value = true
}

function openExecuteDialog(plan: BreedingPlan) {
  selectedPlan.value = plan
  executeForm.value = {
    result: 'success',
    notes: ''
  }
  showExecuteDialog.value = true
}

function handleAdd() {
  if (!form.value.sowId || !form.value.boarId || !form.value.plannedDate) {
    ElMessage.error('请填写完整信息')
    return
  }

  const sow = store.getSowById(form.value.sowId)
  if (sow && sow.status !== 'empty') {
    ElMessage.error('只有待配种状态的母猪才能分配种计划')
    return
  }

  store.addBreedingPlan(form.value)
  showAddDialog.value = false
  ElMessage.success('配种计划创建成功')
}

function handleExecute() {
  if (!selectedPlan.value) return

  store.completeBreedingPlan(selectedPlan.value.id, executeForm.value.result, executeForm.value.notes)
  showExecuteDialog.value = false
  ElMessage.success(`配种${executeForm.value.result === 'success' ? '成功' : '失败'}，已记录`)
}

function handleCancel(plan: BreedingPlan) {
  plan.status = 'cancelled'
  plan.updatedAt = new Date().toISOString().split('T')[0]
  ElMessage.success('配种计划已取消')
}

function isPlanOverdue(plan: BreedingPlan): boolean {
  return plan.status === 'pending' && new Date(plan.plannedDate) < new Date()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">配种计划</h2>
        <p class="text-gray-500">待执行 {{ pendingCount }} | 已完成 {{ completedCount }}</p>
      </div>
      <ElButton type="primary" icon="Plus" @click="openAddDialog">新建配种计划</ElButton>
    </div>

    <ElCard>
      <div class="flex items-center gap-4 mb-4">
        <ElInput
          v-model="searchQuery"
          placeholder="搜索母猪或公猪耳标号"
          style="width: 300px"
        />
        <ElSelect
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 150px"
        >
          <ElOption label="全部" value="all" />
          <ElOption v-for="(value, key) in planStatusMap" :key="key" :label="value.label" :value="key" />
        </ElSelect>
      </div>

      <ElTable :data="filteredPlans" border>
        <ElTableColumn prop="plannedDate" label="计划日期">
          <template #default="scope">
            <span :class="{ 'text-danger': isPlanOverdue(scope.row as BreedingPlan) }">
              {{ scope.row.plannedDate }}
              <ElTag v-if="isPlanOverdue(scope.row as BreedingPlan)" type="danger" size="small">已过期</ElTag>
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="母猪">
          <template #default="scope">
            {{ store.getSowById(scope.row.sowId)?.earTag || '未知' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="母猪状态">
          <template #default="scope">
            <ElTag :type="store.getSowById(scope.row.sowId)?.status === 'empty' ? 'warning' : 'success'">
              {{ store.getSowById(scope.row.sowId)?.status === 'empty' ? '待配种' : '已配种' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="公猪">
          <template #default="scope">
            {{ store.getBoarById(scope.row.boarId)?.earTag || '未知' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="type" label="配种方式">
          <template #default="scope">
            {{ breedingTypeMap[scope.row.type] }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="reason" label="配种原因" />
        <ElTableColumn prop="status" label="状态">
          <template #default="scope">
            <ElTag :type="planStatusMap[scope.row.status].type">
              {{ planStatusMap[scope.row.status].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="actualDate" label="实际执行日期" />
        <ElTableColumn label="操作">
          <template #default="scope">
            <ElButton
              v-if="(scope.row as BreedingPlan).status === 'pending'"
              size="small"
              type="success"
              icon="Check"
              @click="openExecuteDialog(scope.row as BreedingPlan)"
            >执行配种</ElButton>
            <ElPopconfirm
              v-if="(scope.row as BreedingPlan).status === 'pending'"
              title="确定取消该配种计划吗？"
              @confirm="handleCancel(scope.row as BreedingPlan)"
            >
              <ElButton size="small" type="danger" icon="X">取消</ElButton>
            </ElPopconfirm>
            <span v-else class="text-gray-400">-</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog title="新建配种计划" v-model="showAddDialog" @close="showAddDialog = false">
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="母猪">
          <ElSelect v-model="form.sowId" placeholder="选择待配种母猪">
            <ElOption
              v-for="sow in store.emptySows"
              :key="sow.id"
              :label="`${sow.earTag} (${sow.breed})`"
              :value="sow.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="公猪">
          <ElSelect v-model="form.boarId" placeholder="选择公猪">
            <ElOption
              v-for="boar in store.activeBoars"
              :key="boar.id"
              :label="`${boar.earTag} (${boar.breed})`"
              :value="boar.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="计划日期">
          <ElDatePicker v-model="form.plannedDate" type="date" />
        </ElFormItem>
        <ElFormItem label="配种方式">
          <ElSelect v-model="form.type">
            <ElOption label="自然配种" value="natural" />
            <ElOption label="人工授精" value="artificial" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="配种原因">
          <ElInput v-model="form.reason" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAddDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleAdd">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog title="执行配种" v-model="showExecuteDialog" @close="showExecuteDialog = false">
      <div v-if="selectedPlan" class="mb-4">
        <p>母猪: {{ store.getSowById(selectedPlan.sowId)?.earTag }}</p>
        <p>公猪: {{ store.getBoarById(selectedPlan.boarId)?.earTag }}</p>
        <p>计划日期: {{ selectedPlan.plannedDate }}</p>
      </div>
      <ElForm :model="executeForm" label-width="120px">
        <ElFormItem label="配种结果">
          <ElSelect v-model="executeForm.result">
            <ElOption label="成功" value="success" />
            <ElOption label="失败" value="failed" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput type="textarea" v-model="executeForm.notes" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showExecuteDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleExecute">确认执行</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
</style>