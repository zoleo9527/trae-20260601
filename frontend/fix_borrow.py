content = '''<template>
  <div class="borrow-page">
    <div class="page-header">
      <h2>钥匙借还管理</h2>
      <p class="page-desc">
        {{ userStore.user?.role === 'dorm_manager' ? '宿管员您好，请进行钥匙借还登记操作' : 
           userStore.user?.role === 'maintenance' ? '维修人员您好，请进行钥匙借还登记操作' : 
           '请进行钥匙借还登记操作' }}
      </p>
    </div>

    <div class="card">
      <el-tabs v-model="activeTab" class="borrow-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="借用登记" name="borrow">
          <div class="tab-content">
            <el-form :model="borrowForm" label-width="120px" class="borrow-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="选择学生" required>
                    <el-select
                      v-model="borrowForm.student_id"
                      placeholder="请选择学生"
                      filterable
                      style="width: 100%"
                      :loading="loadingStudents"
                    >
                      <el-option
                        v-for="student in students"
                        :key="student.id"
                        :label="student.name + ' - ' + student.student_no + ' (' + student.building + student.room + ')'"
                        :value="student.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="选择钥匙" required>
                    <el-select
                      v-model="borrowForm.key_id"
                      placeholder="请选择可用钥匙"
                      filterable
                      style="width: 100%"
                      :loading="loadingKeys"
                    >
                      <el-option
                        v-for="key in availableKeys"
                        :key="key.id"
                        :label="key.key_number + ' - ' + key.building + key.room"
                        :value="key.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="预计归还" required>
                    <el-date-picker
                      v-model="borrowForm.expected_return_time"
                      type="datetime"
                      placeholder="选择预计归还时间"
                      style="width: 100%"
                      :disabled-date="disabledDate"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="备注">
                    <el-input v-model="borrowForm.remark" placeholder="选填" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="submitBorrow" :loading="submitting">
                  <el-icon><Check /></el-icon>
                  确认借用
                </el-button>
                <el-button @click="resetBorrowForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="待归还列表" name="pending">
          <div class="tab-content">
            <div v-loading="loadingPending">
              <el-table v-if="pendingRecords.length > 0" :data="pendingRecords" stripe style="width: 100%">
                <el-table-column prop="key.key_number" label="钥匙编号" width="120">
                  <template #default="{ row }">
                    {{ row.key?.key_number || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="key.building" label="楼栋" width="100">
                  <template #default="{ row }">
                    {{ row.key?.building || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="key.room" label="房间" width="100">
                  <template #default="{ row }">
                    {{ row.key?.room || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="student_name" label="借用人" width="120" />
                <el-table-column prop="borrow_time" label="借用时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.borrow_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="expected_return_time" label="预计归还" width="180">
                  <template #default="{ row }">
                    <span :class="{ 'overdue': row.is_overdue }">
                      {{ formatTime(row.expected_return_time) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.is_overdue" type="danger" size="small">逾期</el-tag>
                    <el-tag v-else type="primary" size="small">借用中</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button type="success" link size="small" @click="handleReturn(row)">
                      归还
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无待归还记录" :image-size="100" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="借还历史" name="history">
          <div class="tab-content">
            <div v-loading="loadingHistory">
              <el-table v-if="allRecords.length > 0" :data="allRecords" stripe style="width: 100%">
                <el-table-column prop="key.key_number" label="钥匙编号" width="120">
                  <template #default="{ row }">
                    {{ row.key?.key_number || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="key.building" label="楼栋" width="100">
                  <template #default="{ row }">
                    {{ row.key?.building || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="key.room" label="房间" width="100">
                  <template #default="{ row }">
                    {{ row.key?.room || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="student_name" label="借用人" width="120" />
                <el-table-column prop="borrow_time" label="借用时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.borrow_time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="actual_return_time" label="归还时间" width="180">
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
              <el-empty v-else description="暂无借还记录" :image-size="100" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="returnDialogVisible"
      title="归还确认"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="钥匙编号">
          <span>{{ selectedReturn?.key?.key_number }}</span>
        </el-form-item>
        <el-form-item label="借用人">
          <span>{{ selectedReturn?.student_name }}</span>
        </el-form-item>
        <el-form-item label="借用时间">
          <span>{{ selectedReturn ? formatTime(selectedReturn.borrow_time) : '' }}</span>
        </el-form-item>
        <el-form-item label="归还备注">
          <el-input v-model="returnRemark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReturn" :loading="submitting">
          确认归还
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getKeys, getStudents, borrowKey, returnKey, getBorrowRecords } from '@/api'
import type { Key, Student, BorrowRecord } from '@/types'
import { Check } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('borrow')
const loadingKeys = ref(false)
const loadingStudents = ref(false)
const loadingPending = ref(false)
const loadingHistory = ref(false)
const submitting = ref(false)
const keys = ref<Key[]>([])
const students = ref<Student[]>([])
const pendingRecords = ref<BorrowRecord[]>([])
const allRecords = ref<BorrowRecord[]>([])

const returnDialogVisible = ref(false)
const selectedReturn = ref<BorrowRecord | null>(null)
const returnRemark = ref('')

const borrowForm = ref({
  student_id: '',
  key_id: null as number | null,
  expected_return_time: '',
  remark: ''
})

const validTabs = ['borrow', 'pending', 'history']

const setTabFromQuery = () => {
  const tab = route.query.tab as string
  if (tab && validTabs.includes(tab)) {
    activeTab.value = tab
  }
}

const availableKeys = computed(() => keys.value.filter((k: Key) => k.status === 'available'))

const formatTime = (time: string) => {
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

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 86400000
}

const resetBorrowForm = () => {
  borrowForm.value = {
    student_id: '',
    key_id: null,
    expected_return_time: '',
    remark: ''
  }
}

const loadKeysAndStudents = async () => {
  loadingKeys.value = true
  loadingStudents.value = true
  try {
    const [keysData, studentsData] = await Promise.all([
      getKeys(),
      getStudents()
    ])
    keys.value = keysData
    students.value = studentsData
  } catch (e) {
    console.error('加载数据失败', e)
    ElMessage.error('加载数据失败')
  } finally {
    loadingKeys.value = false
    loadingStudents.value = false
  }
}

const loadPendingRecords = async () => {
  loadingPending.value = true
  try {
    const data = await getBorrowRecords({ status: 'active' })
    pendingRecords.value = data
  } catch (e) {
    console.error('加载待归还记录失败', e)
    ElMessage.error('加载待归还记录失败')
  } finally {
    loadingPending.value = false
  }
}

const loadAllRecords = async () => {
  loadingHistory.value = true
  try {
    const data = await getBorrowRecords({ status: 'all' })
    allRecords.value = data.sort((a, b) => 
      new Date(b.borrow_time).getTime() - new Date(a.borrow_time).getTime()
    )
  } catch (e) {
    console.error('加载借还历史失败', e)
    ElMessage.error('加载借还历史失败')
  } finally {
    loadingHistory.value = false
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'borrow') {
    loadKeysAndStudents()
  } else if (tabName === 'pending') {
    loadPendingRecords()
  } else if (tabName === 'history') {
    loadAllRecords()
  }
}

const submitBorrow = async () => {
  if (!borrowForm.value.student_id || !borrowForm.value.key_id || !borrowForm.value.expected_return_time) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  submitting.value = true
  try {
    await borrowKey({
      key_id: borrowForm.value.key_id,
      student_id: borrowForm.value.student_id,
      expected_return_time: borrowForm.value.expected_return_time,
      operator: userStore.user?.name || '未知',
      remark: borrowForm.value.remark
    })
    ElMessage.success('借用成功')
    resetBorrowForm()
    loadKeysAndStudents()
    loadPendingRecords()
    loadAllRecords()
  } catch (e) {
    console.error('借用失败', e)
    ElMessage.error('借用失败')
  } finally {
    submitting.value = false
  }
}

const handleReturn = (row: BorrowRecord) => {
  selectedReturn.value = row
  returnRemark.value = ''
  returnDialogVisible.value = true
}

const confirmReturn = async () => {
  if (!selectedReturn.value) return
  
  submitting.value = true
  try {
    await returnKey({
      record_id: selectedReturn.value.id,
      key_id: selectedReturn.value.key_id,
      operator: userStore.user?.name || '未知',
      remark: returnRemark.value
    })
    ElMessage.success('归还成功')
    returnDialogVisible.value = false
    loadKeysAndStudents()
    loadPendingRecords()
    loadAllRecords()
  } catch (e) {
    console.error('归还失败', e)
    ElMessage.error('归还失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => route.query.tab,
  () => {
    setTabFromQuery()
  }
)

onMounted(() => {
  setTabFromQuery()
  loadKeysAndStudents()
  loadPendingRecords()
  loadAllRecords()
})
</script>

<style scoped>
.borrow-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  margin-bottom: 10px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.borrow-tabs {
  margin-top: -10px;
}

.tab-content {
  padding-top: 10px;
}

.borrow-form {
  max-width: 800px;
}

.overdue {
  color: #ef4444;
  font-weight: 500;
}
</style>
'''

with open('src/views/Borrow.vue', 'w') as f:
    f.write(content)
print('Borrow.vue written successfully')
