import fs from 'fs'
import path from 'path'

const borrowContent = `<template>
  <div class="borrow-page">
    <div class="card">
      <el-tabs v-model="activeTab" class="borrow-tabs">
        <el-tab-pane label="借用登记" name="borrow">
          <div class="tab-content">
            <el-form :model="borrowForm" label-width="120px" class="borrow-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="选择学生" required>
                    <el-select v-model="borrowForm.student_id" placeholder="请选择学生" filterable style="width: 100%">
                      <el-option v-for="student in students" :key="student.id" :label="student.name" :value="student.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="选择钥匙" required>
                    <el-select v-model="borrowForm.key_id" placeholder="请选择可用钥匙" filterable style="width: 100%">
                      <el-option v-for="key in availableKeys" :key="key.id" :label="key.key_number" :value="key.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="submitBorrow" :loading="submitting">确认借用</el-button>
                <el-button @click="resetBorrowForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待归还列表" name="pending">
          <div class="tab-content">
            <el-table :data="pendingRecords" v-loading="loading" stripe style="width: 100%">
              <el-table-column prop="key_number" label="钥匙编号" width="120" />
              <el-table-column prop="student_name" label="借用人" width="120" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="success" link size="small" @click="handleReturn(row)">归还</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="借还历史" name="history">
          <div class="tab-content">
            <el-table :data="allRecords" v-loading="loading" stripe style="width: 100%">
              <el-table-column prop="key_number" label="钥匙编号" width="120" />
              <el-table-column prop="student_name" label="借用人" width="120" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.actual_return_time" type="success" size="small">已归还</el-tag>
                  <el-tag v-else type="primary" size="small">借用中</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getKeys, getStudents, borrowKey, returnKey, getOperationLogs } from '@/api'
import type { Key, Student, OperationLog } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('borrow')
const loading = ref(false)
const submitting = ref(false)
const keys = ref<Key[]>([])
const students = ref<Student[]>([])
const logs = ref<OperationLog[]>([])

const borrowForm = ref({
  student_id: '',
  key_id: null as number | null,
  expected_return_time: '',
  remark: ''
})

const availableKeys = computed(() => keys.value.filter((k: Key) => k.status === 'available'))

const pendingRecords = computed(() => {
  return keys.value.filter((k: Key) => k.status === 'borrowed').map((k: Key) => ({
    id: k.id,
    key_id: k.id,
    key_number: k.key_number,
    building: k.building,
    room: k.room,
    student_name: k.current_holder || '',
    borrow_time: k.updated_at,
    expected_return_time: k.updated_at,
    is_overdue: false
  }))
})

const allRecords = computed(() => {
  const records: any[] = []
  logs.value.filter((l: OperationLog) => l.action === 'borrow').forEach((log: OperationLog) => {
    const key = keys.value.find((k: Key) => k.id === log.key_id)
    if (!key) return
    records.push({
      id: log.id,
      key_number: key.key_number,
      student_name: '',
      actual_return_time: null
    })
  })
  return records
})

const resetBorrowForm = () => {
  borrowForm.value = { student_id: '', key_id: null, expected_return_time: '', remark: '' }
}

const loadData = async () => {
  loading.value = true
  try {
    const [keysData, studentsData, logsData] = await Promise.all([
      getKeys(), getStudents(), getOperationLogs({ limit: 100 })
    ])
    keys.value = keysData
    students.value = studentsData
    logs.value = logsData
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

const submitBorrow = async () => {
  if (!borrowForm.value.student_id || !borrowForm.value.key_id) {
    ElMessage.warning('请选择学生和钥匙')
    return
  }
  submitting.value = true
  try {
    await borrowKey({
      key_id: borrowForm.value.key_id,
      student_id: borrowForm.value.student_id,
      operator: userStore.user?.name || '未知',
      remark: borrowForm.value.remark
    })
    ElMessage.success('借用成功')
    resetBorrowForm()
    loadData()
  } catch (e) {
    console.error('借用失败', e)
  } finally {
    submitting.value = false
  }
}

const handleReturn = async (row: any) => {
  try {
    await returnKey({
      key_id: row.key_id,
      operator: userStore.user?.name || '未知'
    })
    ElMessage.success('归还成功')
    loadData()
  } catch (e) {
    console.error('归还失败', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.borrow-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
</style>
`

fs.writeFileSync(path.join(process.cwd(), 'src/views/Borrow.vue'), borrowContent)
console.log('Borrow.vue fixed!')

const lostContent = `<template>
  <div class="lost-page">
    <div class="card">
      <el-tabs v-model="activeTab" class="lost-tabs">
        <el-tab-pane label="挂失登记" name="report">
          <div class="tab-content">
            <el-form :model="lostForm" label-width="120px" class="lost-form">
              <el-form-item label="选择钥匙" required>
                <el-select v-model="lostForm.key_id" placeholder="请选择钥匙" filterable style="width: 100%">
                  <el-option v-for="key in availableKeys" :key="key.id" :label="key.key_number" :value="key.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="学生姓名" required>
                <el-input v-model="lostForm.student_name" placeholder="请输入学生姓名" />
              </el-form-item>
              <el-form-item label="挂失原因" required>
                <el-input v-model="lostForm.lost_reason" type="textarea" :rows="3" placeholder="请输入挂失原因" />
              </el-form-item>
              <el-form-item>
                <el-button type="danger" @click="submitLost" :loading="submitting">确认挂失</el-button>
                <el-button @click="resetLostForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待补配列表" name="pending">
          <div class="tab-content">
            <el-table :data="pendingLostRecords" v-loading="loading" stripe style="width: 100%">
              <el-table-column prop="key_number" label="钥匙编号" width="120" />
              <el-table-column prop="student_name" label="挂失人" width="120" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleReplace(row)">补配</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="历史回看" name="history">
          <div class="tab-content">
            <el-table :data="allLostRecords" v-loading="loading" stripe style="width: 100%">
              <el-table-column prop="key_number" label="钥匙编号" width="120" />
              <el-table-column prop="student_name" label="挂失人" width="120" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.status === 'replaced'" type="success" size="small">已补配</el-tag>
                  <el-tag v-else type="warning" size="small">挂失中</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKeys, reportLost, replaceKey, getOperationLogs } from '@/api'
import type { Key, OperationLog } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('report')
const loading = ref(false)
const submitting = ref(false)
const keys = ref<Key[]>([])
const logs = ref<OperationLog[]>([])

const lostForm = ref({
  key_id: null as number | null,
  student_name: '',
  lost_reason: '',
  replace_fee: 0
})

const availableKeys = computed(() => keys.value.filter((k: Key) => k.status !== 'lost'))

const pendingLostRecords = computed(() => {
  return keys.value.filter((k: Key) => k.status === 'lost').map((k: Key) => ({
    id: k.id,
    lost_record_id: k.id,
    key_id: k.id,
    key_number: k.key_number,
    building: k.building,
    room: k.room,
    student_name: '',
    lost_time: k.updated_at,
    lost_reason: '',
    status: 'lost'
  }))
})

const allLostRecords = computed(() => {
  const records: any[] = []
  logs.value.filter((l: OperationLog) => l.action === 'report_lost').forEach((log: OperationLog) => {
    const key = keys.value.find((k: Key) => k.id === log.key_id)
    if (!key) return
    records.push({
      id: log.id,
      key_number: key.key_number,
      student_name: '',
      status: 'lost'
    })
  })
  return records
})

const resetLostForm = () => {
  lostForm.value = { key_id: null, student_name: '', lost_reason: '', replace_fee: 0 }
}

const loadData = async () => {
  loading.value = true
  try {
    const [keysData, logsData] = await Promise.all([
      getKeys(), getOperationLogs({ limit: 100 })
    ])
    keys.value = keysData
    logs.value = logsData
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

const submitLost = async () => {
  if (!lostForm.value.key_id || !lostForm.value.student_name || !lostForm.value.lost_reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await ElMessageBox.confirm('确认挂失此钥匙？', '确认挂失', { type: 'warning' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await reportLost({
      key_id: lostForm.value.key_id,
      student_name: lostForm.value.student_name,
      lost_reason: lostForm.value.lost_reason,
      operator: userStore.user?.name || '未知'
    })
    ElMessage.success('挂失成功')
    resetLostForm()
    activeTab.value = 'pending'
    loadData()
  } catch (e) {
    console.error('挂失失败', e)
  } finally {
    submitting.value = false
  }
}

const handleReplace = async (row: any) => {
  const { value: newKeyNumber } = await ElMessageBox.prompt('请输入新钥匙编号', '补配处理')
  if (!newKeyNumber) return
  submitting.value = true
  try {
    await replaceKey({
      lost_record_id: row.lost_record_id,
      new_key_number: newKeyNumber,
      building: row.building,
      room: row.room,
      operator: userStore.user?.name || '未知'
    })
    ElMessage.success('补配成功')
    loadData()
  } catch (e) {
    console.error('补配失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.lost-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
.lost-tabs {
  margin-top: -10px;
}
.tab-content {
  padding-top: 10px;
}
.lost-form {
  max-width: 800px;
}
</style>
`

fs.writeFileSync(path.join(process.cwd(), 'src/views/Lost.vue'), lostContent)
console.log('Lost.vue fixed!')
