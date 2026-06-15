<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElSelect, ElOption, ElMessage, ElBadge, ElTabs, ElTabPane } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const orders = ref<any[]>([])
const installers = ref<any[]>([])
const alerts = ref<any[]>([])
const showDialog = ref(false)
const showAssignDialog = ref(false)
const selectedOrder = ref<any>(null)
const selectedInstaller = ref<number | null>(null)

const form = ref({
  customer_name: '',
  customer_phone: '',
  address: '',
  product_type: '',
  product_model: '',
  scheduled_time: new Date()
})

const statusMap = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' },
  'LIABILITY_PENDING': { label: '待责任判定', type: 'danger' },
  'LIABILITY_DONE': { label: '责任已判定', type: 'success' }
}

const loadOrders = async () => {
  try {
    const response = await api.get<any[]>('/orders')
    orders.value = response
  } catch (error) {
    console.error('加载订单失败:', error)
  }
}

const loadInstallers = async () => {
  try {
    const response = await api.get<any[]>('/users?role=INSTALLER')
    installers.value = response
  } catch (error) {
    console.error('加载师傅列表失败:', error)
  }
}

const loadAlerts = async () => {
  try {
    const response = await api.get<any[]>('/alerts?is_read=false')
    alerts.value = response
  } catch (error) {
    console.error('加载提醒失败:', error)
  }
}

const handleCreateOrder = async () => {
  try {
    await api.post('/orders', {
      ...form.value,
      scheduled_time: form.value.scheduled_time.toISOString()
    }, { dispatcher_id: userStore.user?.id })
    ElMessage.success('订单创建成功')
    showDialog.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error('订单创建失败')
  }
}

const handleAssign = (order: any) => {
  selectedOrder.value = order
  showAssignDialog.value = true
}

const handleAssignSubmit = async () => {
  if (!selectedInstaller.value) {
    ElMessage.error('请选择师傅')
    return
  }
  try {
    await api.put(`/orders/${selectedOrder.value.id}/assign`, null, { installer_id: selectedInstaller.value })
    ElMessage.success('分配成功')
    showAssignDialog.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error('分配失败')
  }
}

const handleViewOrder = (order: any) => {
  router.push(`/history/order/${order.id}`)
}

const handleViewAlert = (alert: any) => {
  router.push(`/history/order/${alert.order_id}`)
}

const handleMarkAlertRead = async (alertId: number) => {
  try {
    await api.put(`/alerts/${alertId}/read`)
    loadAlerts()
  } catch (error) {
    console.error('标记失败:', error)
  }
}

onMounted(() => {
  loadOrders()
  loadInstallers()
  loadAlerts()
})
</script>

<template>
  <div class="dispatch-page">
    <el-tabs>
      <el-tab-pane label="订单看板">
        <el-card>
          <div class="header">
            <el-button type="primary" @click="showDialog = true">创建订单</el-button>
            <el-badge :value="alerts.length" class="alert-badge">
              <el-button @click="router.push('/dispatch/alerts')">异常提醒</el-button>
            </el-badge>
          </div>
          <el-table :data="orders" style="width: 100%">
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="customer_name" label="客户姓名" width="120" />
            <el-table-column prop="customer_phone" label="客户电话" width="120" />
            <el-table-column prop="product_type" label="产品类型" width="100" />
            <el-table-column prop="product_model" label="产品型号" width="120" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type">
                  {{ statusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button v-if="row.status === 'PENDING'" type="primary" size="small" @click="handleAssign(row)">
                  分配师傅
                </el-button>
                <el-button size="small" @click="handleViewOrder(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="异常提醒">
        <el-card>
          <div v-if="alerts.length === 0" class="no-alerts">
            <p>暂无异常提醒</p>
          </div>
          <div v-else>
            <div v-for="alert in alerts" :key="alert.id" class="alert-item">
              <el-card :class="{ 'alert-card': alert.severity === 'HIGH', 'warning-card': alert.severity === 'MEDIUM' }">
                <div class="alert-content">
                  <div>
                    <el-tag :type="alert.severity === 'HIGH' ? 'danger' : 'warning'">
                      {{ alert.type }}
                    </el-tag>
                    <span class="alert-message">{{ alert.message }}</span>
                  </div>
                  <div class="alert-actions">
                    <el-button type="primary" size="small" @click="handleViewAlert(alert)">
                      查看订单
                    </el-button>
                    <el-button size="small" @click="handleMarkAlertRead(alert.id)">
                      标记已读
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showDialog" title="创建订单" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户姓名">
          <el-input v-model="form.customer_name" />
        </el-form-item>
        <el-form-item label="客户电话">
          <el-input v-model="form.customer_phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="产品类型">
          <el-input v-model="form.product_type" />
        </el-form-item>
        <el-form-item label="产品型号">
          <el-input v-model="form.product_model" />
        </el-form-item>
        <el-form-item label="预约时间">
          <el-date-picker v-model="form.scheduled_time" type="datetime" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateOrder">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAssignDialog" title="分配师傅" width="400px">
      <el-form label-width="100px">
        <el-form-item label="选择师傅">
          <el-select v-model="selectedInstaller" placeholder="请选择师傅">
            <el-option
              v-for="installer in installers"
              :key="installer.id"
              :label="installer.name"
              :value="installer.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dispatch-page {
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.alert-badge {
  margin-left: 10px;
}

.no-alerts {
  text-align: center;
  padding: 40px;
  color: #999;
}

.alert-item {
  margin-bottom: 15px;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-message {
  margin-left: 10px;
  font-size: 14px;
}

.alert-actions {
  display: flex;
  gap: 10px;
}

.alert-card {
  border: 2px solid #f5222d;
  background-color: #fff1f0;
}

.warning-card {
  border: 2px solid #fa8c16;
  background-color: #fff7e6;
}
</style>