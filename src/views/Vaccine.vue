<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const showAddDialog = ref(false)

const searchQuery = ref('')
const animalTypeFilter = ref<string>('all')

const vaccineNames = ['猪瘟疫苗', '伪狂犬疫苗', '圆环病毒疫苗', '口蹄疫疫苗', '蓝耳病疫苗', '大肠杆菌疫苗']
const units = ['ml', '头份', '瓶']

const form = ref({
  animalId: '',
  animalType: 'sow' as 'sow' | 'boar' | 'piglet',
  vaccineName: '猪瘟疫苗',
  dose: 1,
  unit: 'ml',
  injectionDate: '',
  nextDueDate: '',
  notes: ''
})

const allAnimals = computed(() => {
  return [
    ...store.sows.map(s => ({ id: s.id, earTag: s.earTag, type: 'sow' as const })),
    ...store.boars.map(b => ({ id: b.id, earTag: b.earTag, type: 'boar' as const }))
  ]
})

const filteredRecords = computed(() => {
  return store.vaccineRecords.filter(record => {
    const animal = allAnimals.value.find(a => a.id === record.animalId)
    const matchesSearch = animal?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         record.vaccineName.includes(searchQuery.value)
    const matchesType = animalTypeFilter.value === 'all' || record.animalType === animalTypeFilter.value
    return matchesSearch && matchesType
  }).sort((a, b) => new Date(b.injectionDate).getTime() - new Date(a.injectionDate).getTime())
})

const upcomingVaccinations = computed(() => {
  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return store.vaccineRecords.filter(record => {
    if (!record.nextDueDate) return false
    const dueDate = new Date(record.nextDueDate)
    return dueDate >= today && dueDate <= nextWeek
  })
})

function openAddDialog() {
  form.value = {
    animalId: '',
    animalType: 'sow',
    vaccineName: '猪瘟疫苗',
    dose: 1,
    unit: 'ml',
    injectionDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    notes: ''
  }
  showAddDialog.value = true
}

function handleAdd() {
  if (!form.value.animalId || !form.value.injectionDate) {
    ElMessage.error('请填写完整信息')
    return
  }

  store.addVaccineRecord({
    ...form.value,
    operator: store.currentUser.id
  })
  showAddDialog.value = false
  ElMessage.success('疫苗接种记录添加成功')
}

function getAnimalInfo(animalId: string, animalType: string) {
  if (animalType === 'sow') {
    return store.getSowById(animalId)?.earTag || '未知'
  } else {
    return store.getBoarById(animalId)?.earTag || '未知'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">疫苗台账</h2>
        <p class="text-gray-500">共 {{ store.vaccineRecords.length }} 条接种记录</p>
      </div>
      <ElButton type="primary" icon="Plus" @click="openAddDialog">添加接种记录</ElButton>
    </div>

    <ElCard v-if="upcomingVaccinations.length > 0" title="近期到期提醒" class="bg-warning/10">
      <div class="flex items-center gap-2 mb-3">
        <component is="AlertTriangle" :size="20" class="text-warning" />
        <span class="text-warning font-medium">以下动物的疫苗接种即将到期，请及时安排</span>
      </div>
      <ElTable :data="upcomingVaccinations" border>
        <ElTableColumn label="动物">
          <template #default="scope">
            {{ getAnimalInfo(scope.row.animalId, scope.row.animalType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="animalType" label="类型">
          <template #default="scope">
            {{ scope.row.animalType === 'sow' ? '母猪' : scope.row.animalType === 'boar' ? '公猪' : '仔猪' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="vaccineName" label="疫苗名称" />
        <ElTableColumn prop="nextDueDate" label="到期日期">
          <template #default="scope">
            <ElTag type="warning">{{ scope.row.nextDueDate }}</ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard>
      <div class="flex items-center gap-4 mb-4">
        <ElInput
          v-model="searchQuery"
          placeholder="搜索耳标号或疫苗名称"
          style="width: 300px"
        />
        <ElSelect
          v-model="animalTypeFilter"
          placeholder="类型筛选"
          style="width: 150px"
        >
          <ElOption label="全部" value="all" />
          <ElOption label="母猪" value="sow" />
          <ElOption label="公猪" value="boar" />
          <ElOption label="仔猪" value="piglet" />
        </ElSelect>
      </div>

      <ElTable :data="filteredRecords" border>
        <ElTableColumn label="动物">
          <template #default="scope">
            {{ getAnimalInfo(scope.row.animalId, scope.row.animalType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="animalType" label="类型">
          <template #default="scope">
            {{ scope.row.animalType === 'sow' ? '母猪' : scope.row.animalType === 'boar' ? '公猪' : '仔猪' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="vaccineName" label="疫苗名称" />
        <ElTableColumn prop="dose" label="剂量">
          <template #default="scope">
            {{ scope.row.dose }} {{ scope.row.unit }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="injectionDate" label="接种日期" />
        <ElTableColumn prop="nextDueDate" label="下次接种日期" />
        <ElTableColumn prop="notes" label="备注" />
        <ElTableColumn prop="createdAt" label="记录时间" />
      </ElTable>
    </ElCard>

    <ElDialog title="添加接种记录" v-model="showAddDialog" @close="showAddDialog = false">
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="动物类型">
          <ElSelect v-model="form.animalType">
            <ElOption label="母猪" value="sow" />
            <ElOption label="公猪" value="boar" />
            <ElOption label="仔猪" value="piglet" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="动物">
          <ElSelect v-model="form.animalId" placeholder="选择动物">
            <ElOption
              v-for="animal in allAnimals.filter(a => a.type === form.animalType)"
              :key="animal.id"
              :label="animal.earTag"
              :value="animal.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="疫苗名称">
          <ElSelect v-model="form.vaccineName">
            <ElOption v-for="name in vaccineNames" :key="name" :label="name" :value="name" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="剂量">
          <div class="flex items-center gap-2">
            <ElInput type="number" v-model.number="form.dose" style="width: 100px" />
            <ElSelect v-model="form.unit" style="width: 80px">
              <ElOption v-for="unit in units" :key="unit" :label="unit" :value="unit" />
            </ElSelect>
          </div>
        </ElFormItem>
        <ElFormItem label="接种日期">
          <ElInput v-model="form.injectionDate" type="date" />
        </ElFormItem>
        <ElFormItem label="下次接种日期">
          <ElInput v-model="form.nextDueDate" type="date" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput type="textarea" v-model="form.notes" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAddDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleAdd">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
</style>