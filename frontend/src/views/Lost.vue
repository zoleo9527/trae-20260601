<template>
  <div class="lost-page">
    <div class="card">
      <el-tabs v-model="activeTab" class="lost-tabs">
        <el-tab-pane label="挂失登记" name="report">
          <div class="tab-content">
            <el-form :model="lostForm" label-width="120px" class="lost-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="选择钥匙" required>
                    <el-select
                      v-model="lostForm.key_id"
                      placeholder="请选择钥匙"
                      filterable
                      style="width: 100%"
                      :loading="loadingKeys"
                    >
                      <el-option
                        v-for="key in availableKeys"
                        :key="key.id"
                        :label="`${key.key_number} - ${key.building}${key.room}`"
                        :value="key.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="学生姓名" required>
                    <el-input v-model="lostForm.student_name" placeholder="请输入学生姓名" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="补配费用">
                    <el-input-number
                      v-model="lostForm.replace_fee"
                      :min="0"
                      :precision="2"
                      placeholder="选填"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="挂失原因" required>
                <el-input
                  v-model="lostForm.lost_reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请详细描述挂失原因"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="danger" @click="submitLost" :loading="submitting">
                  <el-icon><Warning /></el-icon>
                  确认挂失
                </el-button>
                <el-button @click="resetLostForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="待补配列表" name="pending">
          <div class="tab-content">
            <el-table :data="pendingLostRecords" v-loading="loadingPending" stripe style="width: 100%">
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
              <el-table-column prop="student_name" label="挂失人" width="120" />
              <el-table-column prop="lost_time" label="挂失时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.lost_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="lost_reason" label="挂失原因" min-width="150" />
              <el-table-column prop="replace_fee" label="费用" width="100">
                <template #default="{ row }">
                  {{ row.replace_fee ? '¥' + row.replace_fee : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleReplace(row)">
                    补配
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史回看" name="history">
          <div class="tab-content">
            <el-table :data="allLostRecords" v-loading="loadingHistory" stripe style="width: 100%">
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
              <el-table-column prop="student_name" label="挂失人" width="120" />
              <el-table-column prop="lost_time" label="挂失时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.lost_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="lost_reason" label="挂失原因" min-width="150" />
              <el-table-column prop="replace_fee" label="费用" width="100">
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
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="replaceDialogVisible"
      title="补配处理"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="replaceForm" label-width="120px">
        <el-form-item label="原钥匙编号">
          <span>{{ selectedLost?.key?.key_number }}</span>
        </el-form-item>
        <el-form-item label="楼栋">
          <span>{{ selectedLost?.key?.building }}</span>
        </el-form-item>
        <el-form-item label="房间">
          <span>{{ selectedLost?.key?.room }}</span>
        </el-form-item>
        <el-form-item label="新钥匙编号" required>
          <el-input v-model="replaceForm.new_key_number" placeholder="请输入新钥匙编号" />
        </el-form-item>
        <el-form-item label="钥匙类型">
          <el-select v-model="replaceForm.key_type" style="width: 100%">
            <el-option label="房间钥匙" value="room" />
            <el-option label="公共区域" value="public" />
            <el-option label="储物间" value="storage" />
          </el-select>
        </el-form-item>
        <el-form-item label="补配费用">
          <el-input-number
            v-model="replaceForm.replace_fee"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReplace" :loading="submitting">
          确认补配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKeys, reportLost, replaceKey, getLostRecords } from '@/api'
import type { Key, LostRecord } from '@/types'
import { Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('report')
const loadingKeys = ref(false)
const loadingPending = ref(false)
const loadingHistory = ref(false)
const submitting = ref(false)
const keys = ref<Key[]>([])
const pendingLostRecords = ref<LostRecord[]>([])
const allLostRecords = ref<LostRecord[]>([])

const replaceDialogVisible = ref(false)
const selectedLost = ref<LostRecord | null>(null)

const lostForm = ref({
  key_id: null as number | null,
  student_name: '',
  lost_reason: '',
  replace_fee: 0
})

const replaceForm = ref({
  new_key_number: '',
  key_type: 'room',
  replace_fee: 0
})

const availableKeys = computed(() => keys.value.filter(k => k.status !== 'lost'))

const validTabs = ['report', 'pending', 'history']

const setTabFromQuery = () => {
  const tab = route.query.tab as string
  if (tab && validTabs.includes(tab)) {
    activeTab.value = tab
  }
}

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

const resetLostForm = () => {
  lostForm.value = {
    key_id: null,
    student_name: '',
    lost_reason: '',
    replace_fee: 0
  }
}

const loadKeys = async () => {
  loadingKeys.value = true
  try {
    const data = await getKeys()
    keys.value = data
  } catch (e) {
    console.error('加载钥匙列表失败', e)
    ElMessage.error('加载钥匙列表失败')
  } finally {
    loadingKeys.value = false
  }
}

const loadPendingRecords = async () => {
  loadingPending.value = true
  try {
    const data = await getLostRecords({ status: 'lost' })
    pendingLostRecords.value = data
  } catch (e) {
    console.error('加载待补配记录失败', e)
    ElMessage.error('加载待补配记录失败')
  } finally {
    loadingPending.value = false
  }
}

const loadAllRecords = async () => {
  loadingHistory.value = true
  try {
    const data = await getLostRecords({ status: 'all' })
    allLostRecords.value = data.sort((a, b) => 
      new Date(b.lost_time).getTime() - new Date(a.lost_time).getTime()
    )
  } catch (e) {
    console.error('加载挂失历史失败', e)
    ElMessage.error('加载挂失历史失败')
  } finally {
    loadingHistory.value = false
  }
}

const submitLost = async () => {
  if (!lostForm.value.key_id || !lostForm.value.student_name || !lostForm.value.lost_reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确认挂失此钥匙？挂失后钥匙状态将变更为挂失中。',
      '确认挂失',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  
  submitting.value = true
  try {
    await reportLost({
      key_id: lostForm.value.key_id!,
      student_name: lostForm.value.student_name,
      lost_reason: lostForm.value.lost_reason,
      replace_fee: lostForm.value.replace_fee || undefined,
      operator: userStore.user?.name || '未知'
    })
    ElMessage.success('挂失成功')
    resetLostForm()
    activeTab.value = 'pending'
    loadKeys()
    loadPendingRecords()
    loadAllRecords()
  } catch (e) {
    console.error('挂失失败', e)
    ElMessage.error('挂失失败')
  } finally {
    submitting.value = false
  }
}

const handleReplace = (row: LostRecord) => {
  selectedLost.value = row
  replaceForm.value = {
    new_key_number: '',
    key_type: 'room',
    replace_fee: row.replace_fee || 0
  }
  replaceDialogVisible.value = true
}

const confirmReplace = async () => {
  if (!selectedLost.value || !replaceForm.value.new_key_number) {
    ElMessage.warning('请填写新钥匙编号')
    return
  }
  
  submitting.value = true
  try {
    await replaceKey({
      lost_record_id: selectedLost.value.id,
      new_key_number: replaceForm.value.new_key_number,
      building: selectedLost.value.key?.building || '',
      room: selectedLost.value.key?.room || '',
      key_type: replaceForm.value.key_type,
      operator: userStore.user?.name || '未知',
      replace_fee: replaceForm.value.replace_fee || undefined
    })
    ElMessage.success('补配成功')
    replaceDialogVisible.value = false
    loadKeys()
    loadPendingRecords()
    loadAllRecords()
  } catch (e) {
    console.error('补配失败', e)
    ElMessage.error('补配失败')
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
  loadKeys()
  loadPendingRecords()
  loadAllRecords()
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
