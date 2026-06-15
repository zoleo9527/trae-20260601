<template>
  <el-dialog :title="isEdit ? '编辑量尺单' : '新增量尺单'" :visible="true" width="600px" @close="$emit('close')">
    <el-form :model="form" ref="formRef" label-width="100px">
      <el-form-item label="客户姓名" prop="customer_name" required>
        <el-input v-model="form.customer_name" placeholder="请输入客户姓名" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone" required>
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="地址" prop="address" required>
        <el-input v-model="form.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="房型" prop="room_type" required>
        <el-select v-model="form.room_type" placeholder="请选择房型">
          <el-option label="客厅" value="客厅" />
          <el-option label="主卧" value="主卧" />
          <el-option label="次卧" value="次卧" />
          <el-option label="书房" value="书房" />
          <el-option label="阳台" value="阳台" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="窗户宽度(米)" prop="window_width" required>
        <el-input v-model.number="form.window_width" placeholder="请输入窗户宽度" />
      </el-form-item>
      <el-form-item label="窗户高度(米)" prop="window_height" required>
        <el-input v-model.number="form.window_height" placeholder="请输入窗户高度" />
      </el-form-item>
      <el-form-item label="窗帘类型" prop="curtain_type" required>
        <el-select v-model="form.curtain_type" placeholder="请选择窗帘类型">
          <el-option label="遮光帘" value="遮光帘" />
          <el-option label="纱帘" value="纱帘" />
          <el-option label="百叶帘" value="百叶帘" />
          <el-option label="卷帘" value="卷帘" />
          <el-option label="蜂巢帘" value="蜂巢帘" />
        </el-select>
      </el-form-item>
      <el-form-item label="面料">
        <el-input v-model="form.fabric" placeholder="请输入面料" />
      </el-form-item>
      <el-form-item label="颜色">
        <el-input v-model="form.color" placeholder="请输入颜色" />
      </el-form-item>
      <el-form-item label="配件">
        <el-input v-model="form.accessories" placeholder="请输入配件" />
      </el-form-item>
      <el-form-item label="备注">
        <el-textarea v-model="form.notes" placeholder="请输入备注" rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  measure: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

const formRef = ref(null)

const form = reactive({
  customer_name: '',
  phone: '',
  address: '',
  room_type: '',
  window_width: '',
  window_height: '',
  curtain_type: '',
  fabric: '',
  color: '',
  accessories: '',
  notes: ''
})

watch(() => props.measure, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      customer_name: newVal.customer_name,
      phone: newVal.phone,
      address: newVal.address,
      room_type: newVal.room_type,
      window_width: newVal.window_width,
      window_height: newVal.window_height,
      curtain_type: newVal.curtain_type,
      fabric: newVal.fabric || '',
      color: newVal.color || '',
      accessories: newVal.accessories || '',
      notes: newVal.notes || ''
    })
  }
}, { immediate: true })

const submitForm = async () => {
  if (!form.customer_name || !form.phone || !form.address || !form.room_type || !form.window_width || !form.window_height || !form.curtain_type) {
    alert('请填写必填项')
    return
  }
  
  try {
    if (props.isEdit) {
      await axios.put(`/api/measures/${props.measure.id}`, form)
    } else {
      await axios.post('/api/measures', form)
    }
    emit('success')
    emit('close')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>
