<template>
  <div class="keys-page">
    <div class="card">
      <div class="filter-section">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="楼栋">
            <el-select v-model="filters.building" placeholder="全部楼栋" clearable style="width: 140px">
              <el-option label="1号楼" value="1号楼" />
              <el-option label="2号楼" value="2号楼" />
              <el-option label="3号楼" value="3号楼" />
              <el-option label="4号楼" value="4号楼" />
              <el-option label="5号楼" value="5号楼" />
            </el-select>
          </el-form-item>
          <el-form-item label="房间">
            <el-input v-model="filters.room" placeholder="房间号" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="在库" value="available" />
              <el-option label="借出" value="borrowed" />
              <el-option label="挂失" value="lost" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="钥匙编号/持有人" clearable style="width: 180px">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadKeys" :loading="loading">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="filteredKeys" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="key_number" label="钥匙编号" width="120" />
        <el-table-column prop="building" label="楼栋" width="100" />
        <el-table-column prop="room" label="房间" width="100" />
        <el-table-column prop="key_type" label="类型" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status-cell">
              <span class="status-dot" :class="row.status"></span>
              <span>{{ getStatusLabel(row.status) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="current_holder" label="当前持有人" width="120">
          <template #default="{ row }">
            {{ row.current_holder || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button
              v-if="row.status === 'available'"
              type="success"
              link
              size="small"
              @click="handleBorrow(row)"
            >
              借用
            </el-button>
            <el-button
              v-if="row.status === 'borrowed'"
              type="warning"
              link
              size="small"
              @click="handleReturn(row)"
            >
              归还
            </el-button>
            <el-button
              v-if="row.status !== 'lost'"
              type="danger"
              link
              size="small"
              @click="handleLost(row)"
            >
              挂失
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredKeys.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-dialog
      v-model="borrowDialogVisible"
      title="借用钥匙"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="borrowForm" label-width="100px">
        <el-form-item label="钥匙编号">
          <span>{{ selectedKey?.key_number }}</span>
        </el-form-item>
        <el-form-item label="楼栋房间">
          <span>{{ selectedKey?.building }} {{ selectedKey?.room }}</span>
        </el-form-item>
        <el-form-item label="借用人">
          <el-select v-model="borrowForm.student_id" placeholder="请选择学生" filterable>
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="`${student.name} (${student.student_no})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker
            v-model="borrowForm.expected_return_time"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="borrowForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBorrow" :loading="submitting">确认借用</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="returnDialogVisible"
      title="归还钥匙"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="钥匙编号">
          <span>{{ selectedKey?.key_number }}</span>
        </el-form-item>
        <el-form-item label="当前持有人">
          <span>{{ selectedKey?.current_holder }}</span>
        </el-form-item>
        <el-form-item label="归还备注">
          <el-input v-model="returnRemark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReturn" :loading="submitting">确认归还</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="lostDialogVisible"
      title="挂失钥匙"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="lostForm" label-width="100px">
        <el-form-item label="钥匙编号">
          <span>{{ selectedKey?.key_number }}</span>
        </el-form-item>
        <el-form-item label="学生姓名">
          <el-input v-model="lostForm.student_name" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="挂失原因">
          <el-input v-model="lostForm.lost_reason" type="textarea" :rows="3" placeholder="请输入挂失原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lostDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitLost" :loading="submitting">确认挂失</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKeys, getStudents, borrowKey, returnKey, reportLost } from '@/api'
import type { Key, Student } from '@/types'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const keys = ref<Key[]>([])
const students = ref<Student[]>([])

const filters = ref({
  building: '',
  room: '',
  status: '',
  keyword: ''
})

const currentPage = ref(1)
const pageSize = ref(10)

const borrowDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const lostDialogVisible = ref(false)
const selectedKey = ref<Key | null>(null)

const borrowForm = ref({
  student_id: '',
  expected_return_time: '',
  remark: ''
})

const returnRemark = ref('')

const lostForm = ref({
  student_name: '',
  lost_reason: ''
})

const filteredKeys = computed(() => {
  let result = [...keys.value]
  
  if (filters.value.building) {
    result = result.filter(k => k.building.includes(filters.value.building))
  }
  
  if (filters.value.room) {
    result = result.filter(k => k.room.includes(filters.value.room))
  }
  
  if (filters.value.status) {
    result = result.filter(k => k.status === filters.value.status)
  }
  
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(k => 
      k.key_number.toLowerCase().includes(keyword) ||
      (k.current_holder && k.current_holder.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: '在库',
    borrowed: '借出',
    lost: '挂失'
  }
  return labels[status] || status
}

const resetFilters = () => {
  filters.value = {
    building: '',
    room: '',
    status: '',
    keyword: ''
  }
  loadKeys()
}

const loadKeys = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.building) params.building = filters.value.building
    if (filters.value.room) params.room = filters.value.room
    if (filters.value.status) params.status = filters.value.status
    keys.value = await getKeys(params)
  } catch (e) {
    console.error('加载钥匙列表失败', e)
  } finally {
    loading.value = false
  }
}

const loadStudents = async () => {
  try {
    students.value = await getStudents()
  } catch (e) {
    console.error('加载学生列表失败', e)
  }
}

const viewDetail = (row: Key) => {
  router.push(`/keys/${row.id}`)
}

const handleBorrow = (row: Key) => {
  selectedKey.value = row
  borrowForm.value = {
    student_id: '',
    expected_return_time: '',
    remark: ''
  }
  borrowDialogVisible.value = true
}

const handleReturn = (row: Key) => {
  selectedKey.value = row
  returnRemark.value = ''
  returnDialogVisible.value = true
}

const handleLost = (row: Key) => {
  selectedKey.value = row
  lostForm.value = {
    student_name: '',
    lost_reason: ''
  }
  lostDialogVisible.value = true
}

const submitBorrow = async () => {
  if (!selectedKey.value || !borrowForm.value.student_id || !borrowForm.value.expected_return_time) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  submitting.value = true
  try {
    await borrowKey({
      key_id: selectedKey.value.id,
      student_id: borrowForm.value.student_id,
      expected_return_time: borrowForm.value.expected_return_time,
      operator: userStore.user?.name || '未知',
      remark: borrowForm.value.remark
    })
    ElMessage.success('借用成功')
    borrowDialogVisible.value = false
    loadKeys()
  } catch (e) {
    console.error('借用失败', e)
  } finally {
    submitting.value = false
  }
}

const submitReturn = async () => {
  if (!selectedKey.value) return
  
  submitting.value = true
  try {
    await returnKey({
      key_id: selectedKey.value.id,
      operator: userStore.user?.name || '未知',
      remark: returnRemark.value
    })
    ElMessage.success('归还成功')
    returnDialogVisible.value = false
    loadKeys()
  } catch (e) {
    console.error('归还失败', e)
  } finally {
    submitting.value = false
  }
}

const submitLost = async () => {
  if (!selectedKey.value || !lostForm.value.student_name || !lostForm.value.lost_reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await ElMessageBox.confirm('确认挂失此钥匙？挂失后将无法撤销。', '确认挂失', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  
  submitting.value = true
  try {
    await reportLost({
      key_id: selectedKey.value.id,
      student_name: lostForm.value.student_name,
      lost_reason: lostForm.value.lost_reason,
      operator: userStore.user?.name || '未知'
    })
    ElMessage.success('挂失成功')
    lostDialogVisible.value = false
    loadKeys()
  } catch (e) {
    console.error('挂失失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadKeys()
  loadStudents()
})
</script>

<style scoped>
.keys-page {
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

.filter-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.filter-form {
  margin: 0;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.available {
  background-color: #10b981;
}

.status-dot.borrowed {
  background-color: #3b82f6;
}

.status-dot.lost {
  background-color: #ef4444;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
