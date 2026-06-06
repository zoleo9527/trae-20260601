<template>
  <div class="key-detail">
    <el-page-header @back="$router.back()" content="钥匙详情" class="page-header" />

    <div v-loading="loading" class="detail-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="card">
            <div class="card-header">
              <h3>基本信息</h3>
              <el-tag :type="getStatusType(key?.status)" size="small">
                {{ getStatusLabel(key?.status) }}
              </el-tag>
            </div>
            <div class="card-body">
              <div class="info-item">
                <span class="label">钥匙编号</span>
                <span class="value">{{ key?.key_number || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">楼栋</span>
                <span class="value">{{ key?.building || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">房间</span>
                <span class="value">{{ key?.room || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">类型</span>
                <span class="value">{{ key?.key_type || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">当前持有人</span>
                <span class="value">{{ key?.current_holder || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间</span>
                <span class="value">{{ formatTime(key?.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="label">更新时间</span>
                <span class="value">{{ formatTime(key?.updated_at) }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>状态流转</h3>
            </div>
            <div class="card-body">
              <el-timeline>
                <el-timeline-item
                  v-for="item in timelineItems"
                  :key="item.id"
                  :timestamp="formatTime(item.time)"
                  :type="item.type"
                  :color="item.color"
                >
                  <div class="timeline-content">
                    <div class="timeline-action">{{ item.action }}</div>
                    <div class="timeline-id">记录ID: {{ item.id }}</div>
                    <div class="timeline-detail">{{ item.detail || '无详情' }}</div>
                    <div class="timeline-operator">
                      <el-tag size="small">{{ item.operator_role || '系统' }}</el-tag>
                      <span>{{ item.operator }}</span>
                    </div>
                  </div>
                </el-timeline-item>
                <el-timeline-item
                  v-if="key?.created_at"
                  :timestamp="formatTime(key.created_at)"
                  type="success"
                  color="#10b981"
                >
                  <div class="timeline-content">
                    <div class="timeline-action">创建钥匙</div>
                    <div class="timeline-detail">系统初始化</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </el-col>

        <el-col :span="16">
          <div class="card">
            <div class="card-header">
              <h3>借还历史记录</h3>
            </div>
            <div class="card-body">
              <el-table :data="borrowRecords" stripe style="width: 100%" v-loading="loadingBorrow">
                <el-table-column prop="id" label="记录ID" width="80" />
                <el-table-column prop="student_name" label="借用人" width="120" />
                <el-table-column prop="borrow_time" label="借用时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.borrow_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="expected_return_time" label="预计归还" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.expected_return_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="actual_return_time" label="实际归还" width="180">
                  <template #default="{ row }">
                    {{ row.actual_return_time ? formatTime(row.actual_return_time) : '未归还' }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.actual_return_time" type="success" size="small">已归还</el-tag>
                    <el-tag v-else-if="row.is_overdue" type="danger" size="small">逾期</el-tag>
                    <el-tag v-else type="primary" size="small">借用中</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作人" width="100" />
                <el-table-column prop="remark" label="备注" min-width="150" />
              </el-table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>挂失补配记录</h3>
            </div>
            <div class="card-body">
              <el-table :data="lostRecords" stripe style="width: 100%" v-loading="loadingLost">
                <el-table-column prop="id" label="记录ID" width="80" />
                <el-table-column prop="student_name" label="挂失人" width="120" />
                <el-table-column prop="lost_time" label="挂失时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.lost_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="lost_reason" label="挂失原因" min-width="150" />
                <el-table-column prop="replace_fee" label="补配费用" width="100">
                  <template #default="{ row }">
                    {{ row.replace_fee ? '¥' + row.replace_fee : '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="replace_time" label="补配时间" width="180">
                  <template #default="{ row }">
                    {{ row.replace_time ? formatTime(row.replace_time) : '待补配' }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.status === 'replaced'" type="success" size="small">已补配</el-tag>
                    <el-tag v-else type="warning" size="small">挂失中</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作人" width="100" />
              </el-table>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getKey, getKeyBorrowRecords, getKeyLostRecords } from '@/api'
import type { Key, BorrowRecord, LostRecord } from '@/types'

const route = useRoute()
const keyId = Number(route.params.id)

const loading = ref(true)
const loadingBorrow = ref(false)
const loadingLost = ref(false)
const key = ref<Key | null>(null)
const borrowRecords = ref<BorrowRecord[]>([])
const lostRecords = ref<LostRecord[]>([])

interface TimelineItem {
  id: number
  time: string
  action: string
  detail?: string
  operator: string
  operator_role?: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color: string
}

const timelineItems = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []

  borrowRecords.value.forEach(record => {
    items.push({
      id: record.id,
      time: record.borrow_time,
      action: '借用钥匙',
      detail: record.remark || `借用人: ${record.student_name}`,
      operator: record.operator,
      operator_role: '宿管员',
      type: 'primary',
      color: '#3b82f6'
    })
    if (record.actual_return_time) {
      items.push({
        id: record.id,
        time: record.actual_return_time,
        action: '归还钥匙',
        detail: record.remark || `归还人: ${record.student_name}`,
        operator: record.operator,
        operator_role: '宿管员',
        type: 'success',
        color: '#10b981'
      })
    }
  })

  lostRecords.value.forEach(record => {
    items.push({
      id: record.id,
      time: record.lost_time,
      action: '挂失钥匙',
      detail: record.lost_reason || `挂失人: ${record.student_name}`,
      operator: record.operator,
      operator_role: '宿管员',
      type: 'danger',
      color: '#ef4444'
    })
    if (record.replace_time) {
      items.push({
        id: record.id,
        time: record.replace_time,
        action: '补配钥匙',
        detail: `费用: ¥${record.replace_fee || 0}`,
        operator: record.operator,
        operator_role: '宿管员',
        type: 'warning',
        color: '#f59e0b'
      })
    }
  })

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
})

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    available: '在库',
    borrowed: '借出',
    lost: '挂失'
  }
  return labels[status || ''] || status
}

const getStatusType = (status?: string) => {
  const types: Record<string, 'success' | 'primary' | 'danger'> = {
    available: 'success',
    borrowed: 'primary',
    lost: 'danger'
  }
  return types[status || ''] || 'info'
}

const loadData = async () => {
  loading.value = true
  loadingBorrow.value = true
  loadingLost.value = true
  try {
    const [keyData, borrowData, lostData] = await Promise.all([
      getKey(keyId),
      getKeyBorrowRecords(keyId),
      getKeyLostRecords(keyId)
    ])
    key.value = keyData
    borrowRecords.value = borrowData.sort((a, b) => 
      new Date(b.borrow_time).getTime() - new Date(a.borrow_time).getTime()
    )
    lostRecords.value = lostData.sort((a, b) => 
      new Date(b.lost_time).getTime() - new Date(a.lost_time).getTime()
    )
  } catch (e) {
    console.error('加载钥匙详情失败', e)
  } finally {
    loading.value = false
    loadingBorrow.value = false
    loadingLost.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.key-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.detail-content {
  min-height: 400px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #64748b;
  font-size: 14px;
}

.info-item .value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
}

.timeline-content {
  padding: 4px 0;
}

.timeline-action {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.timeline-id {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.timeline-detail {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.timeline-operator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
