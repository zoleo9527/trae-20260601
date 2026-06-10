<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { warehouseTransferApi } from '@/api'
import {
  warehouseStatusLabels,
  warehouseStatusColors,
  formatFileSize,
  guideTaskStatusLabels
} from '@/utils/constants'
import type { WarehouseTransfer, FruitDetailItem } from '@/types'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import FruitDetailsEditor from '@/components/FruitDetailsEditor.vue'

const route = useRoute()
const router = useRouter()

const transfer = ref<WarehouseTransfer | any>(null)
const loading = ref(false)
const activeTab = ref('base')
const showReceiveModal = ref(false)
const showStoreModal = ref(false)
const fruitDetails = ref<FruitDetailItem[]>([])
const receiveRemark = ref('')
const storeLocation = ref('')
const storeRemark = ref('')
const submitting = ref(false)

const transferId = computed(() => parseInt(route.params.id as string))

const displayFruitDetails = computed(() => {
  if (!transfer.value) return []
  const parsed = (transfer.value as any).fruit_details_parsed
  return parsed || []
})

async function loadDetail() {
  loading.value = true
  try {
    const data = await warehouseTransferApi.getDetail(transferId.value)
    transfer.value = data
  } catch (e) {
    console.error('加载详情失败:', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/warehouse')
}

function goGuideTask() {
  if (transfer.value) {
    router.push(`/guide-tasks/${transfer.value.guide_task_id}`)
  }
}

function goReception() {
  if (transfer.value) {
    router.push(`/receptions`)
  }
}

function openReceiveModal() {
  fruitDetails.value = []
  receiveRemark.value = ''
  showReceiveModal.value = true
}

async function handleReceive() {
  const total = fruitDetails.value.reduce((sum, item) => sum + item.weight, 0)

  submitting.value = true
  try {
    await warehouseTransferApi.receive(transferId.value, {
      fruit_details: fruitDetails.value,
      total_weight: total,
      remark: receiveRemark.value
    })
    showReceiveModal.value = false
    loadDetail()
  } catch (e: any) {
    alert('操作失败：' + (e.error || e.message))
  } finally {
    submitting.value = false
  }
}

function openStoreModal() {
  storeLocation.value = ''
  storeRemark.value = ''
  showStoreModal.value = true
}

async function handleStore() {
  if (!storeLocation.value) {
    alert('请填写库位')
    return
  }
  submitting.value = true
  try {
    await warehouseTransferApi.store(transferId.value, {
      storage_location: storeLocation.value,
      remark: storeRemark.value
    })
    showStoreModal.value = false
    loadDetail()
  } catch (e: any) {
    alert('操作失败：' + (e.error || e.message))
  } finally {
    submitting.value = false
  }
}

function handleAttachmentChanged() {
  loadDetail()
}

const statusTagStyle = computed(() => {
  if (!transfer.value) return {}
  return {
    background: warehouseStatusColors[transfer.value.status] + '20',
    color: warehouseStatusColors[transfer.value.status]
  }
})

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="page-container">
    <div class="breadcrumb">
      <a href="javascript:void(0)" @click="goBack">仓库交接</a>
      <span>/</span>
      <span>交接详情</span>
    </div>

    <div v-if="loading" class="card" style="text-align: center; padding: 60px; color: #999;">
      加载中...
    </div>

    <template v-else-if="transfer">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; margin-bottom: 8px;">
              仓库交接单
              <span
                class="tag"
                :style="statusTagStyle"
                style="margin-left: 12px; font-size: 13px; padding: 4px 10px;"
              >
                {{ warehouseStatusLabels[transfer.status] }}
              </span>
            </h2>
            <div style="color: #999; font-size: 13px;">
              交接单号：{{ transfer.transfer_no }} · 关联任务：
              <a href="javascript:void(0)" style="color: #1890ff;" @click="goGuideTask">
                {{ transfer.task_no }}
              </a>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click="goBack">返回列表</button>
            <button
              v-if="transfer.status === 'pending'"
              class="btn btn-primary"
              @click="openReceiveModal"
            >
              接收果品
            </button>
            <button
              v-if="transfer.status === 'received'"
              class="btn btn-success"
              @click="openStoreModal"
            >
              确认入库
            </button>
          </div>
        </div>

        <div class="step-nav" style="background: #fafafa;">
          <div class="step-item done">
            <div class="step-num">1</div>
            <div>
              <div class="step-title">创建接待</div>
              <div style="font-size: 11px; color: #999;">{{ transfer.group_name }}</div>
            </div>
          </div>
          <div class="step-item done">
            <div class="step-num">2</div>
            <div>
              <div class="step-title">向导采摘</div>
              <div style="font-size: 11px; color: #999;">{{ transfer.guide_name }}</div>
            </div>
          </div>
          <div
            class="step-item"
            :class="{
              done: ['received', 'stored'].includes(transfer.status),
              active: transfer.status === 'pending'
            }"
          >
            <div class="step-num">3</div>
            <div>
              <div class="step-title">仓库接收</div>
              <div style="font-size: 11px; color: #999;">
                {{ transfer.received_by_name || '待接收' }}
              </div>
            </div>
          </div>
          <div class="step-item" :class="{ active: transfer.status === 'stored' }">
            <div class="step-num">4</div>
            <div>
              <div class="step-title">入库完成</div>
              <div style="font-size: 11px; color: #999;">
                {{ transfer.storage_location || '待入库' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'base' }" @click="activeTab = 'base'">基本信息</div>
          <div class="tab-item" :class="{ active: activeTab === 'fruits' }" @click="activeTab = 'fruits'">果品明细</div>
          <div class="tab-item" :class="{ active: activeTab === 'attachments' }" @click="activeTab = 'attachments'">
            附件
            <span v-if="transfer.attachments && transfer.attachments.length > 0" class="tag" style="margin-left: 4px;">
              {{ transfer.attachments.length }}
            </span>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">操作日志</div>
        </div>

        <div v-if="activeTab === 'base'">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">交接单号：</span>
              <span class="detail-value">{{ transfer.transfer_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">关联任务：</span>
              <span class="detail-value" style="color: #1890ff; cursor: pointer;" @click="goGuideTask">
                {{ transfer.task_no }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">团体名称：</span>
              <span class="detail-value">{{ transfer.group_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">人数：</span>
              <span class="detail-value">{{ transfer.people_count }} 人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">采摘区域：</span>
              <span class="detail-value">{{ transfer.picking_area || '未指定' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">总重量：</span>
              <span class="detail-value">{{ transfer.total_weight }} 斤</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态：</span>
              <span class="detail-value">
                <span class="tag" :style="statusTagStyle">
                  {{ warehouseStatusLabels[transfer.status] }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">接收人：</span>
              <span class="detail-value">{{ transfer.received_by_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">接收时间：</span>
              <span class="detail-value">{{ transfer.received_time || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">库位：</span>
              <span class="detail-value">{{ transfer.storage_location || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">入库时间：</span>
              <span class="detail-value">{{ transfer.stored_time || '-' }}</span>
            </div>
            <div class="detail-item" style="grid-column: span 2;">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ transfer.remark || '-' }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'fruits'">
          <div v-if="transfer.status === 'pending'" style="text-align: center; padding: 40px; color: #999;">
            接收后可查看果品明细
          </div>
          <div v-else-if="displayFruitDetails.length > 0">
            <FruitDetailsEditor v-model="displayFruitDetails" :readonly="true" />
          </div>
          <div v-else style="text-align: center; padding: 40px; color: #999;">
            暂无果品明细
          </div>
        </div>

        <div v-if="activeTab === 'attachments'">
          <div style="margin-bottom: 16px;">
            <AttachmentUpload
              biz-type="warehouse_transfer"
              :biz-id="transfer.id"
              @uploaded="handleAttachmentChanged"
              @deleted="handleAttachmentChanged"
            />
          </div>
          <div v-if="!transfer.attachments || transfer.attachments.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无附件
          </div>
          <div v-else class="attachment-list">
            <div v-for="item in transfer.attachments" :key="item.id" class="attachment-item">
              <div class="attachment-icon">
                {{ item.file_name.split('.').pop()?.toUpperCase() || 'FILE' }}
              </div>
              <div class="attachment-info">
                <div class="attachment-name">{{ item.file_name }}</div>
                <div class="attachment-size">
                  {{ formatFileSize(item.file_size) }} · {{ item.created_at }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'logs'">
          <div v-if="!transfer.auditLogs || transfer.auditLogs.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无操作记录
          </div>
          <div v-else class="timeline">
            <div v-for="log in transfer.auditLogs" :key="log.id" class="timeline-item">
              <div class="timeline-action">{{ log.action }}</div>
              <div class="timeline-time">{{ log.operator_name || '系统' }} · {{ log.created_at }}</div>
              <div v-if="log.detail" class="timeline-detail">{{ log.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showReceiveModal" class="modal-mask" @click.self="showReceiveModal = false">
      <div class="modal" style="max-width: 640px;">
        <div class="modal-header">
          <span class="modal-title">接收果品</span>
          <button class="modal-close" @click="showReceiveModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">实收果品明细</label>
            <FruitDetailsEditor v-model="fruitDetails" />
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea v-model="receiveRemark" class="form-textarea" placeholder="接收情况说明等"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showReceiveModal = false">取消</button>
          <button class="btn btn-primary" @click="handleReceive" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认接收' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showStoreModal" class="modal-mask" @click.self="showStoreModal = false">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <span class="modal-title">确认入库</span>
          <button class="modal-close" @click="showStoreModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">库位 *</label>
            <input
              v-model="storeLocation"
              type="text"
              class="form-input"
              placeholder="例如：A区-01号货架"
            />
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea v-model="storeRemark" class="form-textarea" placeholder="入库说明"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showStoreModal = false">取消</button>
          <button class="btn btn-primary" @click="handleStore" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认入库' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
