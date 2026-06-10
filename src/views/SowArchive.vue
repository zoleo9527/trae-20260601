<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import type { Sow, SowStatus, HealthStatus } from '@/types'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker, ElPopconfirm } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showBatchDialog = ref(false)
const selectedRows = ref<Sow[]>([])

const searchQuery = ref('')
const statusFilter = ref<SowStatus | 'all'>('all')
const healthFilter = ref<HealthStatus | 'all'>('all')

const sowStatusMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  empty: { label: '待配种', type: 'warning' },
  pregnant: { label: '怀孕中', type: 'success' },
  lactating: { label: '泌乳中', type: 'primary' },
  weaning: { label: '断奶期', type: 'info' },
  culled: { label: '已淘汰', type: 'danger' }
}

const healthStatusMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  healthy: { label: '健康', type: 'success' },
  monitoring: { label: '监测中', type: 'warning' },
  sick: { label: '患病', type: 'danger' }
}

const breeds = ['大白猪', '长白猪', '杜洛克', '二元杂', '三元杂']

const form = ref({
  earTag: '',
  breed: '大白猪',
  birthDate: '',
  parity: 0,
  status: 'empty' as SowStatus,
  healthStatus: 'healthy' as HealthStatus
})

const batchForm = ref('')

const currentEditingSow = ref<Sow | null>(null)

const filteredSows = computed(() => {
  return store.sows.filter(sow => {
    const matchesSearch = sow.earTag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         sow.breed.includes(searchQuery.value)
    const matchesStatus = statusFilter.value === 'all' || sow.status === statusFilter.value
    const matchesHealth = healthFilter.value === 'all' || sow.healthStatus === healthFilter.value
    return matchesSearch && matchesStatus && matchesHealth
  })
})

function openAddDialog() {
  form.value = {
    earTag: '',
    breed: '大白猪',
    birthDate: '',
    parity: 0,
    status: 'empty',
    healthStatus: 'healthy'
  }
  showAddDialog.value = true
}

function openEditDialog(sow: Sow) {
  currentEditingSow.value = sow
  form.value = {
    earTag: sow.earTag,
    breed: sow.breed,
    birthDate: sow.birthDate,
    parity: sow.parity,
    status: sow.status,
    healthStatus: sow.healthStatus
  }
  showEditDialog.value = true
}

function handleAdd() {
  if (!form.value.earTag) {
    ElMessage.error('请输入耳标号')
    return
  }
  store.addSow({
    ...form.value,
    litterCount: 0
  })
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function handleEdit() {
  if (!currentEditingSow.value) return
  store.updateSow(currentEditingSow.value.id, {
    earTag: form.value.earTag,
    breed: form.value.breed,
    birthDate: form.value.birthDate,
    parity: form.value.parity,
    status: form.value.status,
    healthStatus: form.value.healthStatus
  })
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

function handleBatchAdd() {
  const lines = batchForm.value.trim().split('\n')
  const newSows = lines.map(line => {
    const parts = line.split(',')
    return {
      earTag: parts[0]?.trim() || '',
      breed: parts[1]?.trim() || '大白猪',
      birthDate: parts[2]?.trim() || new Date().toISOString().split('T')[0],
      parity: parseInt(parts[3]?.trim() || '0'),
      status: (parts[4]?.trim() || 'empty') as SowStatus,
      healthStatus: (parts[5]?.trim() || 'healthy') as HealthStatus,
      litterCount: 0
    }
  }).filter(s => s.earTag)

  if (newSows.length === 0) {
    ElMessage.error('请输入有效数据')
    return
  }

  store.batchAddSows(newSows)
  showBatchDialog.value = false
  batchForm.value = ''
  ElMessage.success(`成功添加 ${newSows.length} 头母猪`)
}

function handleDelete(sow: Sow) {
  if (sow.status !== 'culled') {
    store.updateSow(sow.id, { status: 'culled' })
  }
  ElMessage.success('已淘汰')
}

function handleBatchDelete() {
  selectedRows.value.forEach(sow => {
    if (sow.status !== 'culled') {
      store.updateSow(sow.id, { status: 'culled' })
    }
  })
  selectedRows.value = []
  ElMessage.success(`已淘汰选中的母猪`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">母猪档案</h2>
        <p class="text-gray-500">共 {{ store.sows.length }} 头母猪</p>
      </div>
      <div class="flex items-center gap-3">
        <ElButton icon="Upload" @click="showBatchDialog = true">批量导入</ElButton>
        <ElButton type="primary" icon="Plus" @click="openAddDialog">添加母猪</ElButton>
      </div>
    </div>

    <ElCard>
      <div class="flex items-center gap-4 mb-4">
        <ElInput
          v-model="searchQuery"
          placeholder="搜索耳标号或品种"
          style="width: 300px"
        />
        <ElSelect
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 150px"
        >
          <ElOption label="全部" value="all" />
          <ElOption v-for="(value, key) in sowStatusMap" :key="key" :label="value.label" :value="key" />
        </ElSelect>
        <ElSelect
          v-model="healthFilter"
          placeholder="健康状态"
          style="width: 150px"
        >
          <ElOption label="全部" value="all" />
          <ElOption v-for="(value, key) in healthStatusMap" :key="key" :label="value.label" :value="key" />
        </ElSelect>
      </div>

      <ElTable
        :data="filteredSows"
        border
        :selectable="(row: Sow) => row.status !== 'culled'"
        @select="(val) => selectedRows = val"
        @select-all="(val) => selectedRows = val"
      >
        <ElTableColumn type="selection" />
        <ElTableColumn prop="earTag" label="耳标号" />
        <ElTableColumn prop="breed" label="品种" />
        <ElTableColumn prop="birthDate" label="出生日期" />
        <ElTableColumn prop="parity" label="胎次" />
        <ElTableColumn prop="litterCount" label="产仔次数" />
        <ElTableColumn prop="status" label="status">
          <template #default="scope">
            <ElTag :type="sowStatusMap[scope.row.status].type">
              {{ sowStatusMap[scope.row.status].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="healthStatus" label="healthStatus">
          <template #default="scope">
            <ElTag :type="healthStatusMap[scope.row.healthStatus].type">
              {{ healthStatusMap[scope.row.healthStatus].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="expectedFarrowingDate" label="预产期" />
        <ElTableColumn prop="updatedAt" label="更新时间" />
        <ElTableColumn label="操作">
          <template #default="scope">
            <ElButton size="small" icon="Edit" @click="openEditDialog(scope.row as Sow)">编辑</ElButton>
            <ElPopconfirm
              title="确定淘汰该母猪吗？"
              @confirm="handleDelete(scope.row as Sow)"
              v-if="(scope.row as Sow).status !== 'culled'"
            >
              <ElButton size="small" type="danger" icon="Delete">淘汰</ElButton>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-if="selectedRows.length > 0" class="mt-4 flex items-center gap-4">
        <span>已选择 {{ selectedRows.length }} 头母猪</span>
        <ElPopconfirm title="确定淘汰选中的母猪吗？" @confirm="handleBatchDelete">
          <ElButton type="danger" size="small">批量淘汰</ElButton>
        </ElPopconfirm>
      </div>
    </ElCard>

    <ElDialog title="添加母猪" v-model="showAddDialog" @close="showAddDialog = false">
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="耳标号">
          <ElInput v-model="form.earTag" />
        </ElFormItem>
        <ElFormItem label="品种">
          <ElSelect v-model="form.breed">
            <ElOption v-for="b in breeds" :key="b" :label="b" :value="b" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="出生日期">
          <ElDatePicker v-model="form.birthDate" type="date" />
        </ElFormItem>
        <ElFormItem label="胎次">
          <ElInput type="number" v-model.number="form.parity" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption v-for="(value, key) in sowStatusMap" :key="key" :label="value.label" :value="key" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="健康状态">
          <ElSelect v-model="form.healthStatus">
            <ElOption v-for="(value, key) in healthStatusMap" :key="key" :label="value.label" :value="key" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAddDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleAdd">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog title="编辑母猪" v-model="showEditDialog" @close="showEditDialog = false">
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="耳标号">
          <ElInput v-model="form.earTag" />
        </ElFormItem>
        <ElFormItem label="品种">
          <ElSelect v-model="form.breed">
            <ElOption v-for="b in breeds" :key="b" :label="b" :value="b" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="出生日期">
          <ElDatePicker v-model="form.birthDate" type="date" />
        </ElFormItem>
        <ElFormItem label="胎次">
          <ElInput type="number" v-model.number="form.parity" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption v-for="(value, key) in sowStatusMap" :key="key" :label="value.label" :value="key" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="健康状态">
          <ElSelect v-model="form.healthStatus">
            <ElOption v-for="(value, key) in healthStatusMap" :key="key" :label="value.label" :value="key" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showEditDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleEdit">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog title="批量导入母猪" v-model="showBatchDialog" width="600px">
      <div>
        <p class="text-gray-500 mb-2">格式：耳标号,品种,出生日期,胎次,状态,健康状态</p>
        <p class="text-gray-400 text-sm mb-4">示例：SO009,大白猪,2023-01-15,0,empty,healthy</p>
        <textarea
          v-model="batchForm"
          rows="10"
          class="w-full"
          placeholder="请输入数据，每行一条..."
        />
      </div>
      <template #footer>
        <ElButton @click="showBatchDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleBatchAdd">导入</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
</style>