<template>
  <div v-if="complaints.length > 0">
    <table>
      <thead>
        <tr>
          <th>投诉编号</th>
          <th>类型</th>
          <th>标题</th>
          <th>游客</th>
          <th>区域</th>
          <th>状态</th>
          <th>责任</th>
          <th>登记时间</th>
          <th>处理人</th>
          <th v-if="showActions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in complaints" :key="item.id">
          <td>{{ item.complaintNo }}</td>
          <td>{{ item.type }}</td>
          <td style="cursor:pointer; color:#67c23a;" @click="$emit('view', item.id)">
            {{ item.title }}
          </td>
          <td>{{ item.visitorName }}</td>
          <td>{{ item.orchardArea }}</td>
          <td>
            <span :class="['status-tag', getStatusClass(item.status)]">
              {{ getStatusLabel(item.status) }}
            </span>
          </td>
          <td>
            <span v-if="item.responsibilityUnclear" class="status-tag status-danger" title="责任归属待确认">
              ⚠️ 待确认
            </span>
            <span v-else style="color:#67c23a; font-size:12px;">已明确</span>
          </td>
          <td>{{ item.registerTime }}</td>
          <td>{{ item.assignedToName || '-' }}</td>
          <td v-if="showActions">
            <button class="btn btn-sm btn-primary" @click="$emit('view', item.id)">查看</button>
            <button 
              v-if="item.status === 'PENDING_VERIFY'" 
              class="btn btn-sm btn-default" 
              style="margin-left:6px;"
              @click="$emit('claim', item.id)"
            >认领</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="empty">暂无数据</div>
</template>

<script setup>
import { STATUS_LABEL } from '../constants'

defineProps({
  complaints: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['view', 'claim'])

function getStatusLabel(status) {
  return STATUS_LABEL[status] || status
}

function getStatusClass(status) {
  const map = {
    PENDING_VERIFY: 'status-pending',
    VERIFYING: 'status-processing',
    PENDING_COMPENSATION: 'status-pending',
    COMPENSATING: 'status-processing',
    PENDING_CLOSE: 'status-pending',
    COMPLETED: 'status-success',
    REJECTED: 'status-danger',
    RETURNED: 'status-danger'
  }
  return map[status] || 'status-pending'
}
</script>
