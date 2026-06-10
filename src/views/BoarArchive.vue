<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import type { Boar, BoarStatus, HealthStatus } from '@/types'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showBatchDialog = ref(false)

const searchQuery = ref('')
const statusFilter = ref<BoarStatus | 'all'>('all')
const healthFilter = ref<HealthStatus | 'all'>('all')

const boarStatusMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  active: { label: '使用中', type: 'success' },
  rest: { label: '休息中', type: 'warning' },
  culled: { label: '已淘汰', type: 'danger' }
}

const healthStatusMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  healthy: { label: '健康', type: 'success' },
  monitoring: { label: '监测中', type: 'warning' },
  sick: { label: '患病', type: 'danger' }
}

const breeds = ['大白猪', '长白猪', '杜洛克', '皮特兰']

const form = ref({
  earTag: '',
  breed: '大白猪',
  birthDate: '',
  status: 'active' as BoarStatus,
  healthStatus: 'healthy' as HealthStatus,
  useCount: 0
})

const batchForm = ref('')
const currentEditingBoar = ref<Boar | null>(null)

const filteredBoars = computed(() => {
  return store.boars.filter(boar => {
    const matchesSearch = boar.earTag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         boar.breed.includes(searchQuery.value)
    const matchesStatus = statusFilter.value === 'all' || boar.status === statusFilter.value
    const matchesHealth = healthFilter.value === 'all' || boar.healthStatus === healthFilter.value
    return matchesSearch && matchesStatus && matchesHealth
  })
})

function openAddDialog() {
  form.value = {
    earTag: '',
    breed: '大白猪',
    birthDate: '',
    status: 'active',
    healthStatus: 'healthy',
    useCount: 0
  }
  showAddDialog.value = true
}

function openEditDialog(boar: Boar) {
  currentEditingBoar.value = boar
  form.value = {
    earTag: boar.earTag,
    breed: boar.breed,
    birthDate: boar.birthDate,
    status: boar.status,
    healthStatus: boar.healthStatus,
    useCount: boar.useCount
  }
  showEditDialog.value = true
}

function handleAdd() {
  if (!form.value.earTag) {
    ElMessage.error('请输入耳标号')
    return
  }
  store.boars.push({
    id: `b${Date.now()}`,
    ...form.value,
    createdBy: store.currentUser.id,
    updatedBy: store.currentUser.id,
    updatedAt: new Date().toISOString().split('T')[0]
  })
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function handleEdit() {
  if (!currentEditingBoar.value) return
  store.updateBoar(currentEditingBoar.value.id, {
    earTag: form.value.earTag,
    breed: form.value.breed,
    birthDate: form.value.birthDate,
    status: form.value.status,
    healthStatus: form.value.healthStatus,
    useCount: form.value.useCount
  })
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

function handleBatchAdd() {
  const lines = batchForm.value.trim().split('\n')
  const newBoars = lines.map(line => {
    const parts = line.split(',')
    return {
      id: `b${Date.now()}`,
      earTag: parts[0]?.trim() || '',
      breed: parts[1]?.trim() || '大白猪',
      birthDate: parts[2]?.trim() || new Date().toISOString().split('T')[0],
      status: (parts[3]?.trim() || 'active') as BoarStatus,
      healthStatus: (parts[4]?.trim() || 'healthy') as HealthStatus,
      useCount: parseInt(parts[5]?.trim() || '0'),
      createdBy: store.currentUser.id,
      updatedBy: store.currentUser.id,
      updatedAt: new Date().toISOString().split('T')[0]
    }
  }).filter(b => b.earTag)

  if (newBoars.length === 0) {
    ElMessage.error('请输入有效数据')
    return
  }

  store.boars.push(...newBoars)
  showBatchDialog.value = false
  batchForm.value = ''
  ElMessage.success(`成功添加 ${newBoars.length} 头公猪`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">公猪档案</h2>
        <p class="text-gray-500">共 {{ store.boars.length }} 头公猪</p>
      </div>
      <div class="flex items-center gap-3">
        <ElButton icon="Upload" @click="showBatchDialog = true">批量导入</ElButton>
        <ElButton type="primary" icon="Plus" @click="openAddDialog">添加公猪</ElButton>
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
          <ElOption v-for="(value, key) in boarStatusMap" :key="key" :label="value.label" :value="key" />
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

      <ElTable :data="filteredBoars" border>
        <ElTableColumn prop="earTag" label="耳标号" />
        <ElTableColumn prop="breed" label="品种" />
        <ElTableColumn prop="birthDate" label="出生日期" />
        <ElTableColumn prop="useCount" label="使用次数" />
        <ElTableColumn prop="status" label="状态">
          <template #default="scope">
            <ElTag :type="boarStatusMap[scope.row.status].type">
              {{ boarStatusMap[scope.row.status].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="healthStatus" label="健康状态">
          <template #default="scope">
            <ElTag :type="healthStatusMap[scope.row.healthStatus].type">
              {{ healthStatusMap[scope.row.healthStatus].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="lastUsedDate" label="最后使用时间" />
        <ElTableColumn prop="updatedAt" label="更新时间" />
        <ElTableColumn label="操作">
          <template #default="scope">
            <ElButton size="small" icon="Edit" @click="openEditDialog(scope.row as Boar)">编辑</ElButton>
            <ElButton
              v-if="(scope.row as Boar).status !== 'culled'"
              size="small"
              type="danger"
              icon="Delete"
              @click="store.updateBoar((scope.row as Boar).id, { status: 'culled' })"
            >淘汰</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog title="添加公猪" v-model="showAddDialog" @close="showAddDialog = false">
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
          <ElInput v-model="form.birthDate" type="date" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption v-for="(value, key) in boarStatusMap" :key="key" :label="value.label" :value="key" />
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

    <ElDialog title="编辑公猪" v-model="showEditDialog" @close="showEditDialog = false">
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
          <ElInput v-model="form.birthDate" type="date" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption v-for="(value, key) in boarStatusMap" :key="key" :label="value.label" :value="key" />
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

    <ElDialog title="批量导入公猪" v-model="showBatchDialog" width="600px">
      <div>
        <p class="text-gray-500 mb-2">格式：耳标号,品种,出生日期,状态,健康状态,使用次数</p>
        <p class="text-gray-400 text-sm mb-4">示例：BO005,大白猪,2022-01-15,active,healthy,0</p>
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