<template>
  <el-dialog title="补充材料" :visible="true" width="400px" @close="$emit('close')">
    <el-form :model="form" label-width="80px">
      <el-form-item label="待补材料">
        <el-textarea v-model="form.materials" placeholder="请输入需要补充的材料" rows="3" />
      </el-form-item>
      <el-form-item label="额外费用(元)">
        <el-input v-model.number="form.additional_cost" placeholder="材料额外费用" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="submitSupplement">确认补充</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue'
import axios from 'axios'

const props = defineProps({
  quote: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const form = reactive({
  materials: '',
  additional_cost: 0
})

const submitSupplement = async () => {
  if (!form.materials.trim()) {
    alert('请输入待补材料')
    return
  }
  
  try {
    await axios.post(`/api/quotes/${props.quote.id}/supplement`, {
      materials: form.materials,
      additional_cost: form.additional_cost || 0
    })
    emit('success')
    emit('close')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>
