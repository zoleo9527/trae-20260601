<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import type { Order, OrderStatus, LiabilityResult } from '../types'
import { 
  ElButton, ElCard, ElTag, ElTable, ElTableColumn, 
  ElImage, ElTimeline, ElTimelineItem, ElDivider,
  ElButtonGroup, ElPopover
} from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const order = ref<Order | null>(null)
const users = ref<any[]>([])

const statusLabels: Record<OrderStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  accepted: '已接单',
  in_progress: '安装中',
  completed: '已完成',
  rework_requested: '待返工',
  rework_in_progress: '返工中',
  rework_completed: '返工完成',
  liability_pending: '待责任判定',
  liability_done: '责任已判定',
  resolved: '已解决'
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'warning',
  assigned: 'info',
  accepted: 'primary',
  in_progress: 'success',
  completed: 'success',
  rework_requested: 'danger',
  rework_in_progress: 'danger',
  rework_completed: 'primary',
  liability_pending: 'warning',
  liability_done: 'success',
  resolved: 'success'
}

const liabilityLabels: Record<LiabilityResult, string> = {
  technician: '安装师傅',
  customer: '用户',
  supplier: '供应商',
  company: '公司'
}

const sortedProgress = computed(() => {
  if (!order.value) return []
  return [...order.value.progress_trackings].sort((a, b) => 
    new Date(a.operated_at).getTime() - new Date(b.operated_at).getTime()
  )
})

const getUserName = (userId: string | undefined) => {
  if (!userId) return '-'
  const user = users.value.find(u => u.id === userId)
  return user?.name || '-'
}

const goBack = () => {
  router.back()
}

const init = async () => {
  const orderId = route.params.id as string
  const result = await store.getOrder(orderId)
  if (result) {
    order.value = result
  }
  users.value = await store.getUsers()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ElButton @click="goBack" type="text">← 返回</ElButton>
          <div>
            <h1 class="text-xl font-bold text-gray-800">订单详情</h1>
            <p class="text-sm text-gray-500">{{ order?.id }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-medium text-gray-700">{{ store.state.currentUser?.name }}</div>
            <div class="text-xs text-gray-500">{{ store.state.currentUser?.role === 'dispatcher' ? '调度员' : store.state.currentUser?.role === 'technician' ? '安装师傅' : '售后客服' }}</div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6" v-if="order">
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-6">
          <ElCard>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">基本信息</h2>
              <ElTag :type="statusColors[order.status]">{{ statusLabels[order.status] }}</ElTag>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500">客户姓名</div>
                <div class="font-medium text-gray-800">{{ order.customer_name }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">联系电话</div>
                <div class="font-medium text-gray-800">{{ order.customer_phone }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">安装地址</div>
                <div class="font-medium text-gray-800">{{ order.address }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">产品类型</div>
                <div class="font-medium text-gray-800">{{ order.product_type }} {{ order.product_model }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">预约时间</div>
                <div class="font-medium text-gray-800">{{ new Date(order.scheduled_date).toLocaleString('zh-CN') }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">调度员</div>
                <div class="font-medium text-gray-800">{{ getUserName(order.dispatcher_id) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">安装师傅</div>
                <div class="font-medium text-gray-800">{{ getUserName(order.technician_id) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">创建时间</div>
                <div class="font-medium text-gray-800">{{ new Date(order.created_at).toLocaleString('zh-CN') }}</div>
              </div>
            </div>
          </ElCard>

          <ElCard>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">配件清单</h2>
            <ElTable :data="order.accessories" border>
              <ElTableColumn prop="name" label="配件名称" />
              <ElTableColumn prop="quantity" label="数量" width="80" />
              <ElTableColumn label="已使用" width="80">
                <template #default="scope">
                  <ElTag :type="scope.row.used ? 'success' : 'warning'">{{ scope.row.used ? '是' : '否' }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="已安装" width="80">
                <template #default="scope">
                  <ElTag :type="scope.row.installed ? 'success' : 'warning'">{{ scope.row.installed ? '是' : '否' }}</ElTag>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>

          <ElCard>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">进度追踪</h2>
            <ElTimeline>
              <ElTimelineItem 
                v-for="progress in sortedProgress" 
                :key="progress.id"
                :status="progress.status === 'completed' ? 'success' : progress.status === 'in_progress' ? 'active' : 'warning'"
              >
                <div class="font-medium">{{ progress.stage }}</div>
                <div class="text-sm text-gray-500">{{ getUserName(progress.operator_id) }} - {{ new Date(progress.operated_at).toLocaleString('zh-CN') }}</div>
                <div v-if="progress.notes" class="text-sm mt-1">{{ progress.notes }}</div>
              </ElTimelineItem>
            </ElTimeline>
          </ElCard>

          <ElCard v-if="order.questions.length > 0">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">追问记录</h2>
            <div class="space-y-4">
              <div v-for="q in order.questions" :key="q.id" class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="font-medium text-gray-800">{{ q.question }}</div>
                    <div class="text-sm text-gray-500">{{ getUserName(q.asked_by) }} - {{ new Date(q.asked_at).toLocaleString('zh-CN') }}</div>
                  </div>
                  <ElTag :type="q.answer ? 'success' : 'warning'">{{ q.answer ? '已回答' : '待回答' }}</ElTag>
                </div>
                <div v-if="q.answer" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="text-sm text-gray-500">回答：</div>
                  <div class="text-gray-700">{{ q.answer }}</div>
                  <div class="text-xs text-gray-400">{{ getUserName(q.answered_by) }} - {{ new Date(q.answered_at!).toLocaleString('zh-CN') }}</div>
                </div>
              </div>
            </div>
          </ElCard>
        </div>

        <div class="space-y-6">
          <ElCard>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">照片记录</h2>
            <div v-if="order.photos.length > 0" class="grid grid-cols-2 gap-3">
              <div v-for="photo in order.photos" :key="photo.id" class="relative group">
                <ElImage 
                  :src="photo.photo_url" 
                  fit="cover" 
                  class="w-full h-32 object-cover rounded"
                />
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div class="text-xs text-white">{{ photo.description }}</div>
                  <div class="text-xs text-gray-300">{{ new Date(photo.uploaded_at).toLocaleDateString('zh-CN') }}</div>
                </div>
                <ElTag class="absolute top-1 right-1" :type="photo.photo_type === 'leakage' ? 'danger' : photo.photo_type === 'rework' ? 'warning' : 'info'">
                  {{ photo.photo_type === 'before' ? '安装前' : photo.photo_type === 'during' ? '安装中' : photo.photo_type === 'after' ? '安装后' : photo.photo_type === 'leakage' ? '漏水' : '返工' }}
                </ElTag>
              </div>
            </div>
            <div v-else class="text-center text-gray-400 py-8">暂无照片</div>
          </ElCard>

          <ElCard v-if="order.after_sales_records.length > 0">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">售后记录</h2>
            <div class="space-y-3">
              <div v-for="record in order.after_sales_records" :key="record.id" class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <ElTag :type="record.type === 'leakage' ? 'danger' : 'warning'">
                    {{ record.type === 'leakage' ? '漏水' : record.type === 'damage' ? '损坏' : '其他' }}
                  </ElTag>
                  <ElTag :type="record.status === 'resolved' ? 'success' : record.status === 'rejected' ? 'danger' : 'warning'">
                    {{ record.status === 'pending' ? '待处理' : record.status === 'processing' ? '处理中' : record.status === 'resolved' ? '已解决' : '已驳回' }}
                  </ElTag>
                </div>
                <div class="text-sm text-gray-700">{{ record.description }}</div>
                <div v-if="record.rejected_reason" class="text-sm text-red-500 mt-1">驳回原因：{{ record.rejected_reason }}</div>
                <div class="text-xs text-gray-400 mt-2">{{ getUserName(record.reported_by) }} - {{ new Date(record.reported_at).toLocaleString('zh-CN') }}</div>
                <div v-if="record.photos.length > 0" class="mt-2 flex gap-2">
                  <ElImage 
                    v-for="(photo, index) in record.photos.slice(0, 3)" 
                    :key="index" 
                    :src="photo" 
                    class="w-16 h-16 object-cover rounded"
                    fit="cover"
                  />
                </div>
              </div>
            </div>
          </ElCard>

          <ElCard v-if="order.responsibility_result">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">责任判定</h2>
            <div class="space-y-3">
              <div>
                <div class="text-sm text-gray-500">责任方</div>
                <ElTag :type="order.responsibility_result.responsible_party === 'technician' ? 'danger' : 'info'" class="text-lg">
                  {{ liabilityLabels[order.responsibility_result.responsible_party] }}
                </ElTag>
              </div>
              <div>
                <div class="text-sm text-gray-500">判定理由</div>
                <div class="text-gray-700">{{ order.responsibility_result.reason }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">赔付金额</div>
                <div class="text-xl font-bold text-red-500">¥{{ order.responsibility_result.compensation_amount }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">状态</div>
                <ElTag :type="order.responsibility_result.status === 'final' ? 'success' : 'warning'">
                  {{ order.responsibility_result.status === 'final' ? '已终审' : '待终审' }}
                </ElTag>
              </div>
              <div>
                <div class="text-sm text-gray-500">判定人</div>
                <div class="text-gray-700">{{ getUserName(order.responsibility_result.created_by) }} - {{ new Date(order.responsibility_result.created_at).toLocaleString('zh-CN') }}</div>
              </div>
              <div v-if="order.responsibility_result.evidence.length > 0">
                <div class="text-sm text-gray-500">证据</div>
                <div class="space-y-1">
                  <div v-for="(item, index) in order.responsibility_result.evidence" :key="index" class="text-sm text-gray-700">{{ item }}</div>
                </div>
              </div>
            </div>
          </ElCard>

          <ElCard v-if="order.rejection_records.length > 0">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">驳回记录</h2>
            <div class="space-y-3">
              <div v-for="rejection in order.rejection_records" :key="rejection.id" class="p-3 bg-orange-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <ElTag type="danger">驳回</ElTag>
                  <ElTag :type="rejection.status === 'resolved' ? 'success' : 'warning'">
                    {{ rejection.status === 'resolved' ? '已解决' : '待处理' }}
                  </ElTag>
                </div>
                <div class="text-sm text-gray-700">{{ rejection.reason }}</div>
                <div v-if="rejection.additional_evidence_required.length > 0" class="mt-2">
                  <div class="text-xs text-gray-500">需要补充的证据：</div>
                  <div class="text-sm text-orange-600">
                    {{ rejection.additional_evidence_required.join(', ') }}
                  </div>
                </div>
                <div class="text-xs text-gray-400 mt-2">{{ getUserName(rejection.rejected_by) }} - {{ new Date(rejection.rejected_at).toLocaleString('zh-CN') }}</div>
              </div>
            </div>
          </ElCard>
        </div>
      </div>
    </main>
  </div>
</template>