<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { receptionApi, attachmentApi } from '@/api'
import { receptionStatusLabels, receptionStatusColors, formatFileSize } from '@/utils/constants'
import type { Reception, GuideTask, Attachment, AuditLog, FruitDetailItem } from '@/types'
import AssignGuideDialog from './components/AssignGuideDialog.vue'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import FruitDetailsEditor from '@/components/FruitDetailsEditor.vue'

const route = useRoute()
const router = useRouter()

const reception = ref<Reception | null>(null)
const loading = ref(false)
const activeTab = ref('base')
const showAssignDialog = ref(false)
const showFruitEditor = ref(false)
const fruitDetails = ref<FruitDetailItem[]>([])

const receptionId = computed(() => parseInt(route.params.id as string))

async function loadDetail() {
  loading.value = true
  try {
    const data = await receptionApi.getDetail(receptionId.value)
    reception.value = data
  } catch (e) {
    console.error('加载详情失败:', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/receptions')
}

function openAssignDialog() {
  showAssignDialog.value = true
}

function handleAssigned() {
  showAssignDialog.value = false
  loadDetail()
}

function handleAttachmentUploaded() {
  loadDetail()
}

function handleAttachmentDeleted() {
  loadDetail()
}

function goGuideTask(taskId: number) {
  router.push(`/guide-tasks/${taskId}`)
}

async function deleteAttachment(id: number) {
  if (!confirm('确定删除该附件吗？')) return
  try {
    await attachmentApi.remove(id)
    loadDetail()
  } catch (e: any) {
    alert('删除失败：' + (e.error || e.message))
  }
}

const statusTagStyle = computed(() => {
  if (!reception.value) return {}
  return {
    background: receptionStatusColors[reception.value.status] + '20',
    color: receptionStatusColors[reception.value.status]
  }
})

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="page-container">
    <div class="breadcrumb">
      <a href="javascript:void(0)" @click="goBack">团体接待</a>
      <span>/</span>
      <span>接待详情</span>
    </div>

    <div v-if="loading" class="card" style="text-align: center; padding: 60px; color: #999;">
      加载中...
    </div>

    <template v-else-if="reception">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; margin-bottom: 8px;">
              {{ reception.group_name }}
              <span
                class="tag"
                :style="statusTagStyle"
                style="margin-left: 12px; font-size: 13px; padding: 4px 10px;"
              >
                {{ receptionStatusLabels[reception.status] }}
              </span>
            </h2>
            <div style="color: #999; font-size: 13px;">
              接待单号：{{ reception.reception_no }}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click="goBack">返回列表</button>
            <button
              v-if="reception.status === 'pending'"
              class="btn btn-primary"
              @click="openAssignDialog"
            >
              分配向导
            </button>
          </div>
        </div>

        <div class="step-nav" style="background: #fafafa;">
          <div class="step-item" :class="{ done: reception.status !== 'pending', active: reception.status === 'pending' }">
            <div class="step-num">1</div>
            <div>
              <div class="step-title">创建接待</div>
              <div style="font-size: 11px; color: #999;">{{ reception.created_at }}</div>
            </div>
          </div>
          <div class="step-item" :class="{ done: ['picking', 'completed'].includes(reception.status), active: reception.status === 'assigned' }">
            <div class="step-num">2</div>
            <div>
              <div class="step-title">分配向导</div>
              <div style="font-size: 11px; color: #999;">
                {{ reception.guideTasks && reception.guideTasks.length > 0 ? '已分配' : '待分配' }}
              </div>
            </div>
          </div>
          <div class="step-item" :class="{ done: reception.status === 'completed', active: reception.status === 'picking' }">
            <div class="step-num">3</div>
            <div>
              <div class="step-title">采摘中</div>
              <div style="font-size: 11px; color: #999;">
                {{ reception.status === 'picking' || reception.status === 'completed' ? '进行中/已完成' : '未开始' }}
              </div>
            </div>
          </div>
          <div class="step-item" :class="{ active: reception.status === 'completed' }">
            <div class="step-num">4</div>
            <div>
              <div class="step-title">已完成</div>
              <div style="font-size: 11px; color: #999;">
                {{ reception.status === 'completed' ? '流程结束' : '进行中' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'base' }" @click="activeTab = 'base'">基本信息</div>
          <div class="tab-item" :class="{ active: activeTab === 'tasks' }" @click="activeTab = 'tasks'">
            向导任务
            <span v-if="reception.guideTasks && reception.guideTasks.length > 0" class="tag" style="margin-left: 4px;">
              {{ reception.guideTasks.length }}
            </span>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'attachments' }" @click="activeTab = 'attachments'">
            附件
            <span v-if="reception.attachments && reception.attachments.length > 0" class="tag" style="margin-left: 4px;">
              {{ reception.attachments.length }}
            </span>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">操作日志</div>
        </div>

        <div v-if="activeTab === 'base'">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">团体名称：</span>
              <span class="detail-value">{{ reception.group_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">接待单号：</span>
              <span class="detail-value">{{ reception.reception_no }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系人：</span>
              <span class="detail-value">{{ reception.contact_person || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系电话：</span>
              <span class="detail-value">{{ reception.contact_phone || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">人数：</span>
              <span class="detail-value">{{ reception.people_count }} 人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">预约日期：</span>
              <span class="detail-value">{{ reception.scheduled_date }} {{ reception.scheduled_time || '' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">来源：</span>
              <span class="detail-value">{{ reception.source || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态：</span>
              <span class="detail-value">
                <span class="tag" :style="statusTagStyle">
                  {{ receptionStatusLabels[reception.status] }}
                </span>
              </span>
            </div>
            <div class="detail-item" style="grid-column: span 2;">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ reception.remark || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建人：</span>
              <span class="detail-value">{{ reception.created_by_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间：</span>
              <span class="detail-value">{{ reception.created_at }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'tasks'">
          <div v-if="!reception.guideTasks || reception.guideTasks.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无向导任务
          </div>
          <div v-else>
            <div
              v-for="task in reception.guideTasks"
              :key="task.id"
              style="padding: 16px; border: 1px solid #f0f0f0; border-radius: 6px; margin-bottom: 12px; cursor: pointer;"
              @click="goGuideTask(task.id)"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #1890ff;">{{ task.task_no }}</span>
                <span class="tag" :style="{ background: receptionStatusColors[task.status] + '20', color: receptionStatusColors[task.status] }">
                  {{ task.status === 'assigned' ? '待开始' : task.status === 'in_progress' ? '进行中' : task.status === 'completed' ? '已完成' : '已取消' }}
                </span>
              </div>
              <div style="display: flex; gap: 24px; font-size: 13px; color: #666;">
                <span>向导：{{ task.guide_name }}</span>
                <span>采摘区域：{{ task.picking_area || '未指定' }}</span>
                <span>总重量：{{ task.total_weight }} 斤</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'attachments'">
          <div style="margin-bottom: 16px;">
            <AttachmentUpload
              biz-type="reception"
              :biz-id="reception.id"
              @uploaded="handleAttachmentUploaded"
            />
          </div>
          <div v-if="!reception.attachments || reception.attachments.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无附件
          </div>
          <div v-else class="attachment-list">
            <div v-for="item in reception.attachments" :key="item.id" class="attachment-item">
              <div class="attachment-icon">
                {{ item.file_name.split('.').pop()?.toUpperCase() || 'FILE' }}
              </div>
              <div class="attachment-info">
                <div class="attachment-name">{{ item.file_name }}</div>
                <div class="attachment-size">
                  {{ formatFileSize(item.file_size) }} · {{ item.created_at }}
                </div>
              </div>
              <button
                class="attachment-delete"
                @click.stop="deleteAttachment(item.id)"
                title="删除"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'logs'">
          <div v-if="!reception.auditLogs || reception.auditLogs.length === 0" style="text-align: center; padding: 40px; color: #999;">
            暂无操作记录
          </div>
          <div v-else class="timeline">
            <div v-for="log in reception.auditLogs" :key="log.id" class="timeline-item">
              <div class="timeline-action">{{ log.action }}</div>
              <div class="timeline-time">{{ log.operator_name || '系统' }} · {{ log.created_at }}</div>
              <div v-if="log.detail" class="timeline-detail">{{ log.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AssignGuideDialog
      v-if="showAssignDialog"
      :reception-id="receptionId"
      @close="showAssignDialog = false"
      @success="handleAssigned"
    />
  </div>
</template>
