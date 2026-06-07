<template>
  <div class="page-container">
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399">今日待处理出库</div>
              <div style="font-size: 32px; font-weight: bold; color: #e6a23c; margin-top: 8px">{{ dashboard.pendingOutboundCount || 0 }}</div>
            </div>
            <div style="width: 60px; height: 60px; background: #fdf6ec; border-radius: 50%; display: flex; align-items: center; justify-content: center">
              <el-icon style="font-size: 28px; color: #e6a23c"><Goods /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399">今日待处理核销</div>
              <div style="font-size: 32px; font-weight: bold; color: #409eff; margin-top: 8px">{{ dashboard.pendingVerificationCount || 0 }}</div>
            </div>
            <div style="width: 60px; height: 60px; background: #ecf5ff; border-radius: 50%; display: flex; align-items: center; justify-content: center">
              <el-icon style="font-size: 28px; color: #409eff"><Present /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399">超时未处理</div>
              <div style="font-size: 32px; font-weight: bold; color: #f56c6c; margin-top: 8px">{{ dashboard.timeoutCount || 0 }}</div>
            </div>
            <div style="width: 60px; height: 60px; background: #fef0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center">
              <el-icon style="font-size: 28px; color: #f56c6c"><Warning /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399">24小时内退回</div>
              <div style="font-size: 32px; font-weight: bold; color: #909399; margin-top: 8px">{{ dashboard.rejectedCount || 0 }}</div>
            </div>
            <div style="width: 60px; height: 60px; background: #f4f4f5; border-radius: 50%; display: flex; align-items: center; justify-content: center">
              <el-icon style="font-size: 28px; color: #909399"><RefreshLeft /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span style="font-weight: 500">今日待处理出库单</span>
              <el-button type="primary" link @click="$router.push('/outbound')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="dashboard.pendingOutboundList || []" size="small" style="width: 100%">
            <el-table-column prop="outboundNo" label="出库单号" width="140">
              <template #default="{ row }">
                <span style="color: #409eff; cursor: pointer" @click="goToOutboundDetail(row.id)">{{ row.outboundNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="roomNo" label="包厢" width="80" />
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.totalAmount }}</template>
            </el-table-column>
            <el-table-column prop="outboundType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.outboundType === 'SALE'" type="success" size="small">销售</el-tag>
                <el-tag v-else type="warning" size="small">赠送</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="goToOutboundDetail(row.id)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!dashboard.pendingOutboundList?.length" description="暂无待处理出库单" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span style="font-weight: 500">今日待处理核销单</span>
              <el-button type="primary" link @click="$router.push('/verification')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="dashboard.pendingVerificationList || []" size="small" style="width: 100%">
            <el-table-column prop="verificationNo" label="核销单号" width="140">
              <template #default="{ row }">
                <span style="color: #409eff; cursor: pointer" @click="goToVerificationDetail(row.id)">{{ row.verificationNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="roomNo" label="包厢" width="80" />
            <el-table-column prop="customerName" label="客户" width="80" />
            <el-table-column prop="usedAmount" label="核销金额" width="100">
              <template #default="{ row }">¥{{ row.usedAmount }}</template>
            </el-table-column>
            <el-table-column prop="outboundStatus" label="出库状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.outboundStatus" :type="getOutboundTagType(row.outboundStatus)" size="small">
                  {{ outboundStatusMap[row.outboundStatus] || row.outboundStatus }}
                </el-tag>
                <span v-else style="color: #909399">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <template v-if="row.status === 'PENDING'">
                  <el-button type="primary" size="small" link @click="goToVerificationDetail(row.id)">审核</el-button>
                </template>
                <template v-else-if="row.status === 'COMPLETED' && row.outboundStatus === 'PENDING'">
                  <el-button type="warning" size="small" link @click="goToOutboundDetail(row.outboundId)">
                    <el-icon><Bell /></el-icon>
                    待出库
                  </el-button>
                </template>
                <template v-else>
                  <el-button type="info" size="small" link @click="goToVerificationDetail(row.id)">查看</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!dashboard.pendingVerificationList?.length" description="暂无待处理核销单" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 500; color: #f56c6c">超时未处理（超过2小时）</span>
          </template>
          <el-table :data="dashboard.timeoutList || []" size="small" style="width: 100%">
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.type === 'OUTBOUND'" type="warning" size="small">出库</el-tag>
                <el-tag v-else type="primary" size="small">核销</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="no" label="单号" width="150">
              <template #default="{ row }">
                <span style="color: #409eff; cursor: pointer" @click="handleTimeoutItem(row)">{{ row.no }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="roomNo" label="包厢" width="80" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="{ row }">
                <span style="color: #f56c6c">{{ formatTime(row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleTimeoutItem(row)">去处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!dashboard.timeoutList?.length" description="暂无超时记录" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 500; color: #909399">24小时内刚退回记录</span>
          </template>
          <el-table :data="dashboard.rejectedList || []" size="small" style="width: 100%">
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.type === 'OUTBOUND'" type="warning" size="small">出库</el-tag>
                <el-tag v-else type="primary" size="small">核销</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="no" label="单号" width="150">
              <template #default="{ row }">
                <span style="color: #409eff; cursor: pointer" @click="handleRejectedItem(row)">{{ row.no }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="roomNo" label="包厢" width="80" />
            <el-table-column prop="rejectReason" label="退回原因" show-overflow-tooltip />
            <el-table-column prop="handleTime" label="退回时间" width="160">
              <template #default="{ row }">{{ formatTime(row.handleTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleRejectedItem(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!dashboard.rejectedList?.length" description="暂无退回记录" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getDashboard } from '@/api/dashboard'
import { Goods, Present, Warning, RefreshLeft, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const dashboard = ref({})

const outboundStatusMap = {
  NOT_CREATED: '未生成',
  PENDING: '待出库',
  COMPLETED: '已出库',
  REJECTED: '已退回'
}

const getOutboundTagType = (status) => {
  const map = {
    PENDING: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
    NOT_CREATED: 'info'
  }
  return map[status] || ''
}

const loadData = async () => {
  dashboard.value = await getDashboard()
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

const goToOutboundDetail = (id) => {
  router.push(`/outbound/${id}`)
}

const goToVerificationDetail = (id) => {
  router.push(`/verification/${id}`)
}

const handleTimeoutItem = (row) => {
  if (row.type === 'OUTBOUND') {
    router.push(`/outbound/${row.id}`)
  } else {
    router.push(`/verification/${row.id}`)
  }
}

const handleRejectedItem = (row) => {
  if (row.type === 'OUTBOUND') {
    router.push(`/outbound/${row.id}`)
  } else {
    router.push(`/verification/${row.id}`)
  }
}

onMounted(() => {
  loadData()
})
</script>
