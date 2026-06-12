<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>入驻验收详情</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div v-if="record">
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">企业名称</div>
            <div class="detail-value">{{ record.enterpriseName }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">合同编号</div>
            <div class="detail-value">{{ record.contractNo }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">楼层</div>
            <div class="detail-value">{{ record.floor }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">房间号</div>
            <div class="detail-value">{{ record.roomNumber }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">面积(㎡)</div>
            <div class="detail-value">{{ record.area }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">合同签订日期</div>
            <div class="detail-value">{{ record.contractDate }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">计划入驻日期</div>
            <div class="detail-value">{{ record.plannedMoveInDate }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">当前状态</div>
            <div class="detail-value">
              <span class="badge" :class="store.getStatusColor(record.status)">
                {{ store.getStatusText(record.status) }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="record.feeStartDate" class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">费用起算日期</div>
            <div class="detail-value" style="color: #10b981; font-weight: 600;">
              {{ record.feeStartDate }}
            </div>
          </div>
        </div>
        
        <div v-if="record.rejectReason" class="reject-box">
          <div class="reject-label">物业退回原因</div>
          <div class="reject-content">{{ record.rejectReason }}</div>
        </div>
        
        <div v-if="record.directorRejectReason" class="reject-box">
          <div class="reject-label">主管退回原因</div>
          <div class="reject-content">{{ record.directorRejectReason }}</div>
        </div>
        
        <div v-if="record.supplementRemark" class="card" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="section-title">补充备注</div>
          <p>{{ record.supplementRemark }}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="section-title">处理流程</div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-title">招商经理提交</div>
            <div class="timeline-time">{{ formatTime(record.submitTime) }}</div>
            <div class="timeline-desc">
              提交人：{{ record.managerName }}
            </div>
          </div>
          
          <div v-if="record.engineerAcceptTime" class="timeline-item">
            <div class="timeline-title">
              物业工程{{ record.engineerResult === 'pass' ? '验收通过' : '验收退回' }}
            </div>
            <div class="timeline-time">{{ formatTime(record.engineerAcceptTime) }}</div>
            <div class="timeline-desc">
              处理人：{{ record.engineerName }}
              <br v-if="record.engineerResult === 'reject' && record.rejectReason" />
              <span v-if="record.engineerResult === 'reject' && record.rejectReason">退回原因：{{ record.rejectReason }}</span>
              <br v-if="record.engineerRemark" />
              <span v-if="record.engineerRemark">备注：{{ record.engineerRemark }}</span>
            </div>
          </div>
          
          <div v-if="record.directorConfirmTime" class="timeline-item">
            <div class="timeline-title">
              招商主管{{ record.directorResult === 'pass' ? '审核通过' : '审核退回' }}
            </div>
            <div class="timeline-time">{{ formatTime(record.directorConfirmTime) }}</div>
            <div class="timeline-desc">
              处理人：{{ record.directorName }}
              <br v-if="record.directorResult === 'reject' && record.directorRejectReason" />
              <span v-if="record.directorResult === 'reject' && record.directorRejectReason">退回原因：{{ record.directorRejectReason }}</span>
              <br v-if="record.directorRemark" />
              <span v-if="record.directorRemark">备注：{{ record.directorRemark }}</span>
              <br v-if="record.feeStartDate" />
              <span v-if="record.feeStartDate">费用起算日期：{{ record.feeStartDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AcceptanceRecord } from '~/types'

const store = useAcceptanceStore()

defineProps<{
  visible: boolean
  record: AcceptanceRecord | null
}>()

defineEmits<{
  close: []
}>()

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>
