<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guideTaskApi, attachmentApi } from '@/api'
import {
  guideTaskStatusLabels,
  guideTaskStatusColors,
  formatFileSize,
  warehouseStatusLabels,
  warehouseStatusColors
} from '@/utils/constants'
import type { GuideTask, FruitDetailItem } from '@/types'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import FruitDetailsEditor from '@/components/FruitDetailsEditor.vue'

const route = useRoute()
const router = useRouter()

const task = ref<GuideTask | any>(null)
const loading = ref(false)
const activeTab = ref('base')
const showCompleteModal = ref(false)
const fruitDetails = ref<FruitDetailItem[]>([])
const totalWeight = ref(0)
const completeRemark = ref('')
const submitting = ref(false)

const taskId = computed(() => parseInt(route.params.id as string))

const displayFruitDetails = computed(() => {
  if (!task.value) return []
  const parsed = (task.value as any).fruit_details_parsed
  return parsed || []
})

async function loadDetail() {
  loading.value = true
  try {
    const data = await guideTaskApi.getDetail(taskId.value)
    task.value = data
  } catch (e) {
    console.error('加载详情失败:', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/guide-tasks')
}

function goReception() {
  if (task.value) {
    router.push(`/receptions/${task.value.reception_id}`)
  }
}

function goWarehouse(transferId: number) {
  router.push(`/warehouse/${transferId}`)
}

async function handleStart() {
  if (!confirm('确认开始采摘任务？')) return
  try {
    await guideTaskApi.start(taskId.value)
    loadDetail()
  } catch (e: any) {
    alert('操作失败：' + (e.error || e.message))
  }
}

function openCompleteModal() {
  fruitDetails.value = []
  totalWeight.value = 0
  completeRemark.value = ''
  showCompleteModal.value = true
}

async function handleComplete() {
  if (fruitDetails.value.length === 0) {
    alert('请添加果品明细')
    return
  }
  const total = fruitDetails.value.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) {
    alert('请填写有效重量')
    return
  }

  submitting.value = true
  try {
    await guideTaskApi.complete(taskId.value, {
      fruit_details: fruitDetails.value,
      total_weight: total,
      remark: completeRemark.value
    })
    showCompleteModal.value = false
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
  if (!task.value) return {}
  return {
    background: guideTaskStatusColors[task.value.status] + '20',
    color: guideTaskStatusColors[task.value.status]
  }
})

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="page-container">
    <div class="breadcrumb">
      <a href="javascript:void(0)" @click="goBack">向导任务</a>
      <span>/</span>
      <span>任务详情</span>
    </div>

    <div v-if="loading" class="card" style="text-align: center; padding: 60px; color: #999;">
      加载中...
    </div>

    <template v-else-if="task">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; margin-bottom: 8px;">
              {{ task.group_name }}
              <span
                class="tag"
                :style="statusTagStyle"
                style="margin-left: 12px; font-size: 13px; padding: 4px 10px;"
              >
                {{ guideTaskStatusLabels[task.status] }}
              </span>
            </h2>
            <div style="color: #999; font-size: 13px;">
              任务编号：{{ task.task_no }} · 接待单：
              <a href="javascript:void(0)" style="color: #1890ff;" @click="goReception">
                {{ task.reception_no }}
              </a>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click="goBack">返回列表</button>
            <button
              v-if="task.status === 'assigned'"
              class="btn btn-primary"
              @click="handleStart"
            >
              开始采摘
            </button>
            <button
              v-if="task.status === 'in_progress'"
              class="btn btn-success"
              @click="openCompleteModal"
            >
              完成采摘
            </button>
          </div>
        </div>

        <div class="step-nav" style="background: #fafafa;">
          <div class="step-item done">
            <div class="step-num">1</div>
            <div>
              <div class="step-title">创建接待</div>
              <div style="font-size: 11px; color: #999;">{{ task.reception_no }}</div>
            </div>
          </div>
          <div class="step-item done">
            <div class="step-num">2</div>
            <div>
              <div class="step-title">分配向导</div>
              <div style="font-size: 11px; color: #999;">{{ task.guide_name }}</div>
            </div>
          </div>
          <div
            class="step-item"
            :class="{
              done: task.status === 'completed',
              active: task.status === 'in_progress'
            }"
          >
            <div class="step-num">3</div>
            <div>
              <div class="step-title">采摘中</div>
              <div style="font-size: 11px; color: #999;">
                {{ task.start_time ? task.start_time + ' 开始' : '未开始' }}
              </div>
            </div>
          </div>
          <div class="step-item" :class="{ active: task.status === 'completed' }">
            <div class="step-num">4</div>
            <div>
              <div class="step-title">仓库交接</div>
              <div style="font-size: 11px; color: #999;">
                {{ task.warehouseTransfer ? task.warehouseTransfer.transfer_no : '待创建' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'base' }" @click="activeTab = 'base'">基本信息</div>
          <div class="tab-item" :class="{ active: activeTab === 'fruits' }" @click="activeTab = 'fruits'">采摘明细</div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'warehouse' }"
            @click="activeTab = 'warehouse'"
          >
            仓库交接
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'attachments' }" @click="activeTab = 'attachments'">
            附件
            <span v-if="task.attachments && task.attachments.length > 0" class="tag" style="margin-left: 4px;">
              {{ task.attachments.length }}
            </span>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">操作日志</div>
        </div>

        <div v-if="activeTab === 'base'">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">任务编号：</span>
              <span class="detail-value">{{ task.task_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">接待单号：</span>
              <span class="detail-value" style="color: #1890ff; cursor: pointer;" @click="goReception">
                {{ task.reception_no }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">团体名称：</span>
              <span class="detail-value">{{ task.group_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">人数：</span>
              <span class="detail-value">{{ task.people_count }} 人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">向导：</span>
              <span class="detail-value">{{ task.guide_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分配人：</span>
              <span class="detail-value">{{ task.assigned_by_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">采摘区域：</span>
              <span class="detail-value">{{ task.picking_area || '未指定' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态：</span>
              <span class="detail-value">
                <span class="tag" :style="statusTagStyle">
                  {{ guideTaskStatusLabels[task.status] }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">开始时间：</span>
              <span class="detail-value">{{ task.start_time || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">结束时间：</span>
              <span class="detail-value">{{ task.end_time || '-' }}</span>
            </div>
            <div class="detail-item" style="grid-column: span 2;">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ task.remark || '-' }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'fruits'">
          <div v-if="task.status !== 'completed'" style="text-align: center; padding: 40px; color: #999;">
            采摘完成后可查看明细
          </div>
          <div v-else-if="displayFruitDetails.length > 0">
            <FruitDetailsEditor v-model="displayFruitDetails" :readonly="true" />
          </div>
          <div v-else style="text-align: center; padding: 40px; color: #999;">
            暂无果品明细
          </div>
        </div>

        <div v-if="activeTab === 'warehouse'">
          <div v-if="!task.warehouseTransfer" style="text-align: center; padding: 40px; color: #999;">
            采摘完成后自动生成仓库交接单
          </div>
          <div v-else style="padding: 16px; border: 1px solid #f0f0f0; border-radius: 6px; cursor: pointer;" @click="goWarehouse(task.warehouseTransfer.id)">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1890ff;">
                {{ task.warehouseTransfer.transfer_no }}
              </span>
              <span
                class="tag"
                :style="{
                  background: warehouseStatusColors[task.warehouseTransfer.status] + '20',
                  color: warehouseStatusColors[task.warehouseTransfer.status]
                }"
              >
                {{ warehouseStatusLabels[task.warehouseTransfer.status] }}
              </span>
            </div>
            <div style="display: flex; gap: 24px; font-size: 13px; color: #666;">
              <span>重量：{{ task.warehouseTransfer.total_weight }} 斤</span>
              <span>接收人：{{ task.warehouseTransfer.received_by_name || '待接收' }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'attachments'">
          <div style="margin-bottom: 16px;">
            <AttachmentUpload
              biz-type="guide_task"
              :biz-id="task.id"
              @uploaded="handleAttachmentChanged"
              @deleted="handleAttachmentChanged"
            />
          </div>
          <div v-if="!task.attachments || task.attachments.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无附件
          </div>
          <div v-else class="attachment-list">
            <div v-for="item in task.attachments" :key="item.id" class="attachment-item">
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
          <div v-if="!task.auditLogs || task.auditLogs.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无操作记录
          </div>
          <div v-else class="timeline">
            <div v-for="log in task.auditLogs" :key="log.id" class="timeline-item">
              <div class="timeline-action">{{ log.action }}</div>
              <div class="timeline-time">{{ log.operator_name || '系统' }} · {{ log.created_at }}</div>
              <div v-if="log.detail" class="timeline-detail">{{ log.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showCompleteModal" class="modal-mask" @click.self="showCompleteModal = false">
      <div class="modal" style="max-width: 640px;">
        <div class="modal-header">
          <span class="modal-title">完成采摘</span>
          <button class="modal-close" @click="showCompleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">采摘果品明细</label>
            <FruitDetailsEditor v-model="fruitDetails" />
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea v-model="completeRemark" class="form-textarea" placeholder="采摘情况说明等"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCompleteModal = false">取消</button>
          <button class="btn btn-primary" @click="handleComplete" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认完成' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
