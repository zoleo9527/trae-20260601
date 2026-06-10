<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const showAddDialog = ref(false)

const searchQuery = ref('')

const form = ref({
  sowId: '',
  farrowingDate: '',
  totalPigs: 0,
  livePigs: 0,
  deadPigs: 0,
  stillborn: 0,
  notes: ''
})

const pregnantSows = computed(() => {
  return store.sows.filter(s => s.status === 'pregnant')
})

const filteredRecords = computed(() => {
  return store.farrowingRecords.filter(record => {
    const sow = store.getSowById(record.sowId)
    return sow?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase())
  }).sort((a, b) => new Date(b.farrowingDate).getTime() - new Date(a.farrowingDate).getTime())
})

function openAddDialog() {
  form.value = {
    sowId: '',
    farrowingDate: new Date().toISOString().split('T')[0],
    totalPigs: 0,
    livePigs: 0,
    deadPigs: 0,
    stillborn: 0,
    notes: ''
  }
  showAddDialog.value = true
}

function handleAdd() {
  if (!form.value.sowId || !form.value.farrowingDate) {
    ElMessage.error('请填写完整信息')
    return
  }

  if (form.value.livePigs + form.value.deadPigs + form.value.stillborn !== form.value.totalPigs) {
    ElMessage.error('活仔数+死仔数+死胎数必须等于总产仔数')
    return
  }

  store.addFarrowingRecord({
    ...form.value,
    operator: store.currentUser.id
  })
  showAddDialog.value = false
  ElMessage.success('分娩记录添加成功')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">产房管理</h2>
        <p class="text-gray-500">共 {{ store.farrowingRecords.length }} 条分娩记录</p>
      </div>
      <ElButton type="primary" icon="Plus" @click="openAddDialog">记录分娩</ElButton>
    </div>

    <ElCard>
      <div class="flex items-center gap-4 mb-4">
        <ElInput
          v-model="searchQuery"
          placeholder="搜索母猪耳标号"
          style="width: 300px"
        />
      </div>

      <ElTable :data="filteredRecords" border>
        <ElTableColumn prop="farrowingDate" label="分娩日期" />
        <ElTableColumn label="母猪">
          <template #default="scope">
            {{ store.getSowById(scope.row.sowId)?.earTag || '未知' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="totalPigs" label="总产仔数" />
        <ElTableColumn prop="livePigs" label="活仔数">
          <template #default="scope">
            <ElTag type="success">{{ scope.row.livePigs }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="deadPigs" label="死仔数">
          <template #default="scope">
            <ElTag type="danger">{{ scope.row.deadPigs }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="stillborn" label="死胎数">
          <template #default="scope">
            <ElTag type="warning">{{ scope.row.stillborn }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="notes" label="备注" />
        <ElTableColumn prop="createdAt" label="记录时间" />
      </ElTable>
    </ElCard>

    <ElCard title="待产母猪提醒">
      <ElTable :data="pregnantSows" border>
        <ElTableColumn prop="earTag" label="耳标号" />
        <ElTableColumn prop="breed" label="品种" />
        <ElTableColumn prop="expectedFarrowingDate" label="预产期" />
        <ElTableColumn label="距离预产期">
          <template #default="scope">
            <span :class="new Date(scope.row.expectedFarrowingDate) < new Date() ? 'text-danger' : 'text-primary'">
              {{ Math.ceil((new Date(scope.row.expectedFarrowingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) }} 天
            </span>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog title="记录分娩" v-model="showAddDialog" @close="showAddDialog = false">
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="母猪">
          <ElSelect v-model="form.sowId" placeholder="选择待产母猪">
            <ElOption
              v-for="sow in pregnantSows"
              :key="sow.id"
              :label="`${sow.earTag} (${sow.breed})`"
              :value="sow.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分娩日期">
          <ElInput v-model="form.farrowingDate" type="date" />
        </ElFormItem>
        <ElFormItem label="总产仔数">
          <ElInput type="number" v-model.number="form.totalPigs" />
        </ElFormItem>
        <ElFormItem label="活仔数">
          <ElInput type="number" v-model.number="form.livePigs" />
        </ElFormItem>
        <ElFormItem label="死仔数">
          <ElInput type="number" v-model.number="form.deadPigs" />
        </ElFormItem>
        <ElFormItem label="死胎数">
          <ElInput type="number" v-model.number="form.stillborn" />
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