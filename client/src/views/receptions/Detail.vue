<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { receptionApi, attachmentApi, guideTaskApi, warehouseTransferApi, fruitApi } from '@/api'
import { receptionStatusLabels, receptionStatusColors, formatFileSize, guideTaskStatusLabels, guideTaskStatusColors, warehouseTransferStatusLabels, warehouseTransferStatusColors } from '@/utils/constants'
import type { Reception, GuideTask, Attachment, AuditLog, FruitDetailItem, Fruit, WarehouseTransfer } from '@/types'
import AssignGuideDialog from './components/AssignGuideDialog.vue'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import FruitDetailsEditor from '@/components/FruitDetailsEditor.vue'

const route = useRoute()
const router = useRouter()

const reception = ref<Reception | null>(null)
const loading = ref(false)
const activeTab = ref('base')
const showAssignDialog = ref(false)

const showCompleteDialog = ref(false)
const showReceiveDialog = ref(false)
const showStoreDialog = ref(false)
const currentTask = ref<GuideTask | null>(null)
const currentTransfer = ref<WarehouseTransfer | null>(null)
const completeFruitDetails = ref<FruitDetailItem[]>([])
const receiveFruitDetails = ref<FruitDetailItem[]>([])
const storageLocation = ref('')
const storeRemark = ref('')
const fruits = ref<Fruit[]>([])

const receptionId = computed(() => parseInt(route.params.id as string))

async function loadFruits() {
  try {
    fruits.value = await fruitApi.getAll()
  } catch (e) {
    console.error('加载果品失败:', e)
  }
}

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

async function deleteAttachment(id: number) {
  if (!confirm('确定删除该附件吗？')) return
  try {
    await attachmentApi.remove(id)
    loadDetail()
  } catch (e: any) {
    alert('删除失败：' + (e.error || e.message))
  }
}

async function startTask(task: GuideTask) {
  if (!confirm('确定要开始此采摘任务吗？')) return
  try {
    await guideTaskApi.start(task.id)
    loadDetail()
  } catch (e: any) {
    alert('开始失败：' + (e.error || e.message))
  }
}

function openCompleteDialog(task: GuideTask) {
  currentTask.value = task
  completeFruitDetails.value = task.fruit_details_parsed ? JSON.parse(JSON.stringify(task.fruit_details_parsed)) : []
  showCompleteDialog.value = true
}

async function submitComplete() {
  if (!currentTask.value) return
  const totalWeight = completeFruitDetails.value.reduce((s, i) => s + (i.weight || 0), 0)
  try {
    await guideTaskApi.complete(currentTask.value.id, {
      fruit_details: completeFruitDetails.value,
      total_weight: totalWeight
    })
    showCompleteDialog.value = false
    currentTask.value = null
    loadDetail()
  } catch (e: any) {
    alert('完成失败：' + (e.error || e.message))
  }
}

function openReceiveDialog(transfer: WarehouseTransfer) {
  currentTransfer.value = transfer
  receiveFruitDetails.value = transfer.fruit_details_parsed ? JSON.parse(JSON.stringify(transfer.fruit_details_parsed)) : []
  showReceiveDialog.value = true
}

async function submitReceive() {
  if (!currentTransfer.value) return
  const totalWeight = receiveFruitDetails.value.reduce((s, i) => s + (i.weight || 0), 0)
  try {
    await warehouseTransferApi.receive(currentTransfer.value.id, {
      fruit_details: receiveFruitDetails.value,
      total_weight: totalWeight
    })
    showReceiveDialog.value = false
    currentTransfer.value = null
    loadDetail()
  } catch (e: any) {
    alert('接收失败：' + (e.error || e.message))
  }
}

function openStoreDialog(transfer: WarehouseTransfer) {
  currentTransfer.value = transfer
  storageLocation.value = ''
  storeRemark.value = ''
  showStoreDialog.value = true
}

async function submitStore() {
  if (!currentTransfer.value) return
  try {
    await warehouseTransferApi.store(currentTransfer.value.id, {
      storage_location: storageLocation.value,
      remark: storeRemark.value
    })
    showStoreDialog.value = false
    currentTransfer.value = null
    loadDetail()
  } catch (e: any) {
    alert('入库失败：' + (e.error || e.message))
  }
}

function goWarehouseDetail(id: number) {
  router.push(`/warehouse/${id}`)
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
  loadFruits()
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
            向导任务与交接
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
            <div style="margin-top: 12px;">
              <button v-if="reception.status === 'pending'" class="btn btn-primary" @click="openAssignDialog">
                立即分配向导
              </button>
            </div>
          </div>

          <div v-else>
            <div
              v-for="task in reception.guideTasks"
              :key="task.id"
              class="task-card"
            >
              <div class="task-header">
                <div>
                  <span class="task-no">{{ task.task_no }}</span>
                  <span class="tag" :style="{ background: guideTaskStatusColors[task.status] + '20', color: guideTaskStatusColors[task.status] }" style="margin-left: 10px;">
                    {{ guideTaskStatusLabels[task.status] }}
                  </span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button
                    v-if="task.status === 'assigned'"
                    class="btn btn-primary btn-sm"
                    @click="startTask(task)"
                  >
                    开始采摘
                  </button>
                  <button
                    v-if="task.status === 'in_progress'"
                    class="btn btn-primary btn-sm"
                    @click="openCompleteDialog(task)"
                  >
                    完成采摘
                  </button>
                </div>
              </div>

              <div class="task-info-row">
                <span>向导：<strong>{{ task.guide_name }}</strong></span>
                <span>采摘区域：{{ task.picking_area || '未指定' }}</span>
                <span>分配人：{{ task.assigned_by_name || '-' }}</span>
              </div>

              <div class="task-info-row">
                <span>开始时间：{{ task.start_time || '-' }}</span>
                <span>结束时间：{{ task.end_time || '-' }}</span>
                <span>总重量：{{ task.total_weight || 0 }} 斤</span>
              </div>

              <div v-if="task.remark" style="margin-top: 10px; color: #666;">
                向导备注：{{ task.remark }}
              </div>

              <div v-if="task.fruit_details_parsed && task.fruit_details_parsed.length > 0" style="margin-top: 14px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">果品明细</div>
                <table class="info-table">
                  <thead>
                    <tr>
                      <th>果品</th>
                      <th>品种</th>
                      <th>重量(斤)</th>
                      <th>单价(元)</th>
                      <th>小计(元)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in task.fruit_details_parsed" :key="idx">
                      <td>{{ item.fruit_name }}</td>
                      <td>{{ item.variety || '-' }}</td>
                      <td>{{ item.weight }}</td>
                      <td>{{ item.price || '-' }}</td>
                      <td>{{ (item.weight || 0) * (item.price || 0) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="task.warehouseTransfers && task.warehouseTransfers.length > 0" style="margin-top: 18px;">
                <div class="divider"></div>
                <div style="font-weight: 600; margin-bottom: 10px; font-size: 13px;">仓库交接单（{{ task.warehouseTransfers.length }}）</div>

                <div
                  v-for="transfer in task.warehouseTransfers"
                  :key="transfer.id"
                  class="transfer-card"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                      <span style="font-weight: 600; color: #1890ff;">{{ transfer.transfer_no }}</span>
                      <span
                        class="tag"
                        style="margin-left: 10px;"
                        :style="{ background: warehouseTransferStatusColors[transfer.status] + '20', color: warehouseTransferStatusColors[transfer.status] }"
                      >
                        {{ warehouseTransferStatusLabels[transfer.status] }}
                      </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button
                        v-if="transfer.status === 'pending'"
                        class="btn btn-primary btn-sm"
                        @click="openReceiveDialog(transfer)"
                      >
                        仓库接收
                      </button>
                      <button
                        v-if="transfer.status === 'received'"
                        class="btn btn-primary btn-sm"
                        @click="openStoreDialog(transfer)"
                      >
                        确认入库
                      </button>
                      <button class="btn btn-sm" @click="goWarehouseDetail(transfer.id)">
                        查看详情
                      </button>
                    </div>
                  </div>

                  <div style="display: flex; gap: 24px; font-size: 13px; color: #666;">
                    <span>接收人：{{ transfer.received_by_name || '-' }}</span>
                    <span>接收时间：{{ transfer.received_time || '-' }}</span>
                    <span>入库时间：{{ transfer.stored_time || '-' }}</span>
                  </div>
                  <div v-if="transfer.storage_location" style="font-size: 13px; color: #666; margin-top: 4px;">
                    存放库位：{{ transfer.storage_location }}
                  </div>
                  <div style="font-size: 13px; color: #666; margin-top: 4px;">
                    总重量：{{ transfer.total_weight || 0 }} 斤
                  </div>

                  <div v-if="transfer.fruit_details_parsed && transfer.fruit_details_parsed.length > 0" style="margin-top: 10px;">
                    <table class="info-table">
                      <thead>
                        <tr>
                          <th>果品</th>
                          <th>品种</th>
                          <th>重量(斤)</th>
                          <th>单价(元)</th>
                          <th>小计(元)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in transfer.fruit_details_parsed" :key="idx">
                          <td>{{ item.fruit_name }}</td>
                          <td>{{ item.variety || '-' }}</td>
                          <td>{{ item.weight }}</td>
                          <td>{{ item.price || '-' }}</td>
                          <td>{{ (item.weight || 0) * (item.price || 0) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-if="transfer.remark" style="margin-top: 8px; color: #999; font-size: 12px;">
                    备注：{{ transfer.remark }}
                  </div>
                </div>
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

    <div v-if="showCompleteDialog" class="modal-mask" @click.self="showCompleteDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>完成采摘 - {{ currentTask?.task_no }}</h3>
          <span class="close" @click="showCompleteDialog = false">×</span>
        </div>
        <div class="modal-body">
          <FruitDetailsEditor v-model:list="completeFruitDetails" :fruits="fruits" />
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCompleteDialog = false">取消</button>
          <button class="btn btn-primary" @click="submitComplete">确认完成</button>
        </div>
      </div>
    </div>

    <div v-if="showReceiveDialog" class="modal-mask" @click.self="showReceiveDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>仓库接收 - {{ currentTransfer?.transfer_no }}</h3>
          <span class="close" @click="showReceiveDialog = false">×</span>
        </div>
        <div class="modal-body">
          <FruitDetailsEditor v-model:list="receiveFruitDetails" :fruits="fruits" />
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showReceiveDialog = false">取消</button>
          <button class="btn btn-primary" @click="submitReceive">确认接收</button>
        </div>
      </div>
    </div>

    <div v-if="showStoreDialog" class="modal-mask" @click.self="showStoreDialog = false">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3>确认入库 - {{ currentTransfer?.transfer_no }}</h3>
          <span class="close" @click="showStoreDialog = false">×</span>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>存放库位 <span style="color: #999;">（选填）</span></label>
            <input v-model="storageLocation" type="text" class="input" placeholder="例：A区-3号货架-第2层" />
          </div>
          <div class="form-item">
            <label>备注 <span style="color: #999;">（选填）</span></label>
            <textarea v-model="storeRemark" class="textarea" rows="3" placeholder="补充说明"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showStoreDialog = false">取消</button>
          <button class="btn btn-primary" @click="submitStore">确认入库</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  padding: 18px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #fff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.task-no {
  font-weight: 600;
  font-size: 15px;
  color: #1890ff;
}

.task-info-row {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 -18px 18px;
}

.transfer-card {
  padding: 14px 16px;
  background: #fafbfc;
  border: 1px solid #eef0f3;
  border-radius: 6px;
  margin-bottom: 10px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.info-table th,
.info-table td {
  border: 1px solid #f0f0f0;
  padding: 8px 12px;
  text-align: left;
}

.info-table th {
  background: #fafafa;
  font-weight: 600;
  color: #666;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.input, .textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.input:focus, .textarea:focus {
  border-color: #1890ff;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 720px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
