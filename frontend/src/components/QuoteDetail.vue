<template>
  <el-dialog title="报价单详情" :visible="true" width="800px" @close="$emit('close')">
    <div class="detail-content">
      <div class="info-section">
        <h4>客户信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">客户姓名：</span>{{ measure?.customer_name || '-' }}</div>
          <div class="info-item"><span class="label">联系电话：</span>{{ measure?.phone || '-' }}</div>
          <div class="info-item"><span class="label">地址：</span>{{ measure?.address || '-' }}</div>
          <div class="info-item"><span class="label">房型：</span>{{ measure?.room_type || '-' }}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>量尺信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">窗户宽度：</span>{{ measure?.window_width || '-' }} 米</div>
          <div class="info-item"><span class="label">窗户高度：</span>{{ measure?.window_height || '-' }} 米</div>
          <div class="info-item"><span class="label">窗帘类型：</span>{{ measure?.curtain_type || '-' }}</div>
          <div class="info-item"><span class="label">面料：</span>{{ measure?.fabric || '-' }}</div>
          <div class="info-item"><span class="label">颜色：</span>{{ measure?.color || '-' }}</div>
          <div class="info-item"><span class="label">配件：</span>{{ measure?.accessories || '-' }}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>量尺备注</h4>
        <p>{{ measure?.notes || '无' }}</p>
      </div>
      
      <div class="info-section">
        <h4>报价信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">报价单号：</span>{{ quote.id }}</div>
          <div class="info-item"><span class="label">量尺单号：</span>{{ quote.measure_id }}</div>
          <div class="info-item"><span class="label">单价：</span>{{ quote.unit_price }} 元/米</div>
          <div class="info-item"><span class="label">数量：</span>{{ quote.quantity }} 米</div>
          <div class="info-item"><span class="label">总价：</span>{{ quote.total_price }} 元</div>
          <div class="info-item"><span class="label">折扣：</span>{{ quote.discount || 0 }}</div>
          <div class="info-item"><span class="label">最终价格：</span><span class="price">¥{{ quote.final_price }}</span></div>
          <div class="info-item"><span class="label">报价备注：</span>{{ quote.notes || '-' }}</div>
          <div class="info-item"><span class="label">待补材料：</span>{{ quote.supplementary_materials || '-' }}</div>
          <div class="info-item"><span class="label">报价状态：</span><el-tag :type="getStatusType(quote.status)">{{ quote.status }}</el-tag></div>
          <div class="info-item"><span class="label">创建人：</span>{{ quote.created_by }}</div>
          <div class="info-item"><span class="label">创建时间：</span>{{ quote.created_at }}</div>
        </div>
      </div>
      
      <div v-if="quote.rejected_reason" class="reject-section">
        <h4>驳回原因</h4>
        <p class="reject-reason">{{ quote.rejected_reason }}</p>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps({
  quote: {
    type: Object,
    required: true
  },
  measure: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const getStatusType = (status) => {
  const types = {
    '待确认': 'warning',
    '已确认': 'success',
    '已驳回': 'danger',
    '待补材料': 'primary',
    '已完成': 'success'
  }
  return types[status] || 'default'
}
</script>

<style scoped>
.detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-item {
  font-size: 14px;
  color: #666;
}

.info-item .label {
  color: #999;
}

.info-item .price {
  font-weight: bold;
  color: #e74c3c;
  font-size: 16px;
}

.reject-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fff5f5;
  border-radius: 8px;
}

.reject-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
  margin-bottom: 10px;
}

.reject-reason {
  font-size: 14px;
  color: #e74c3c;
}
</style>
