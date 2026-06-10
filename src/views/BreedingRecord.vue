<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElSelect, ElOption, ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'

const store = useFarmStore()

const searchQuery = ref('')
const resultFilter = ref<string>('all')

const resultMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'danger' },
  pending: { label: '待确认', type: 'warning' }
}

const breedingTypeMap: Record<string, string> = {
  natural: '自然配种',
  artificial: '人工授精'
}

const filteredRecords = computed(() => {
  return store.breedingRecords.filter(record => {
    const sow = store.getSowById(record.sowId)
    const boar = store.getBoarById(record.boarId)
    const matchesSearch = sow?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         boar?.earTag.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesResult = resultFilter.value === 'all' || record.result === resultFilter.value
    return matchesSearch && matchesResult
  }).sort((a, b) => new Date(b.breedingDate).getTime() - new Date(a.breedingDate).getTime())
})

const successCount = computed(() => store.breedingRecords.filter(r => r.result === 'success').length)
const pendingCount = computed(() => store.breedingRecords.filter(r => r.result === 'pending').length)

function confirmConception(record: { conceptionConfirmed: boolean; confirmedDate?: string }) {
  record.conceptionConfirmed = true
  record.confirmedDate = new Date().toISOString().split('T')[0]
  ElMessage.success('受孕已确认')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">配种记录</h2>
        <p class="text-gray-500">成功 {{ successCount }} | 待确认 {{ pendingCount }}</p>
      </div>
    </div>

    <ElCard>
      <div class="flex items-center gap-4 mb-4">
        <ElInput
          v-model="searchQuery"
          placeholder="搜索母猪或公猪耳标号"
          style="width: 300px"
        />
        <ElSelect
          v-model="resultFilter"
          placeholder="结果筛选"
          style="width: 150px"
        >
          <ElOption label="全部" value="all" />
          <ElOption v-for="(value, key) in resultMap" :key="key" :label="value.label" :value="key" />
        </ElSelect>
      </div>

      <ElTable :data="filteredRecords" border>
        <ElTableColumn prop="breedingDate" label="配种日期" />
        <ElTableColumn label="母猪">
          <template #default="scope">
            {{ store.getSowById(scope.row.sowId)?.earTag || '未知' }}
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
        <ElTableColumn prop="result" label="配种结果">
          <template #default="scope">
            <ElTag :type="resultMap[scope.row.result].type">
              {{ resultMap[scope.row.result].label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="受孕确认">
          <template #default="scope">
            <template v-if="scope.row.result === 'success'">
              <ElTag v-if="scope.row.conceptionConfirmed" type="success">已确认</ElTag>
              <ElButton
                v-else
                size="small"
                type="primary"
                icon="Check"
                @click="confirmConception(scope.row as any)"
              >确认受孕</ElButton>
            </template>
            <span v-else class="text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="confirmedDate" label="确认日期" />
        <ElTableColumn prop="notes" label="备注" />
        <ElTableColumn prop="createdAt" label="记录时间" />
      </ElTable>
    </ElCard>
  </div>
</template>

<style scoped>
</style>