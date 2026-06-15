<template>
  <el-dialog :title="title" :visible="true" width="400px" @close="$emit('close')">
    <el-form :model="form" label-width="80px">
      <el-form-item label="驳回原因">
        <el-textarea v-model="form.reason" placeholder="请输入驳回原因" rows="3" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="danger" @click="submitReject">确认驳回</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue'
import axios from 'axios'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const form = reactive({
  reason: ''
})

const submitReject = async () => {
  if (!form.reason.trim()) {
    alert('请输入驳回原因')
    return
  }
  
  try {
    if (props.type === 'measure') {
      await axios.post(`/api/measures/${props.targetId}/reject`, { reason: form.reason })
    } else {
      await axios.post(`/api/quotes/${props.targetId}/reject`, { reason: form.reason })
    }
    emit('success')
    emit('close')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>
