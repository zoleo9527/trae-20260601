<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ mode === 'create' ? '创建报关资料' : '编辑报关资料' }}
        </h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="px-6 py-4 overflow-y-auto flex-1">
        <div class="space-y-4">
          <div v-if="mode === 'create'">
            <label class="label">关联订单 *</label>
            <select v-model="form.orderId" class="input-field" @change="handleOrderChange">
              <option value="">请选择订单</option>
              <option v-for="order in availableOrders" :key="order.id" :value="order.id">
                {{ order.orderNo }} - {{ order.buyerName }} ({{ order.totalAmount }} {{ order.currency }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">出口商 *</label>
              <input v-model="form.exporter" type="text" class="input-field" placeholder="请输入出口商名称" />
            </div>
            <div>
              <label class="label">进口商 *</label>
              <input v-model="form.importer" type="text" class="input-field" placeholder="请输入进口商名称" />
            </div>
          </div>

          <div>
            <label class="label">货物描述 *</label>
            <textarea v-model="form.goodsDescription" rows="3" class="input-field" placeholder="请输入货物描述"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">HS编码 *</label>
              <input v-model="form.hsCode" type="text" class="input-field" placeholder="请输入HS编码" />
            </div>
            <div>
              <label class="label">申报价值 *</label>
              <div class="flex gap-2">
                <input v-model.number="form.declaredValue" type="number" step="0.01" class="input-field flex-1" placeholder="0.00" />
                <select v-model="form.currency" class="input-field w-24">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">重量 (kg) *</label>
              <input v-model.number="form.weight" type="number" step="0.01" class="input-field" placeholder="0.00" />
            </div>
            <div>
              <label class="label">数量 (件) *</label>
              <input v-model.number="form.quantity" type="number" class="input-field" placeholder="0" />
            </div>
          </div>

          <div v-if="mode === 'create' && selectedOrder" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800 font-medium mb-2">订单商品信息</p>
            <div class="space-y-1">
              <div v-for="item in selectedOrder.skuList" :key="item.sku" class="text-xs text-blue-700">
                {{ item.sku }} - {{ item.name }} x {{ item.quantity }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '提交中...' : (mode === 'create' ? '创建' : '保存') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import type { Order, CustomsDocument } from '~/types'

interface Props {
  visible: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<CustomsDocument> | null
  availableOrders?: Order[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mode: 'create',
  initialData: null,
  availableOrders: () => []
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: any): void
}>()

const appStore = useAppStore()
const submitting = ref(false)

const defaultForm = {
  orderId: '',
  orderNo: '',
  exporter: '',
  importer: '',
  goodsDescription: '',
  hsCode: '',
  declaredValue: 0,
  currency: 'USD',
  weight: 0,
  quantity: 0
}

const form = ref({ ...defaultForm })

const selectedOrder = computed(() => {
  return props.availableOrders?.find(o => o.id === form.value.orderId) || null
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.mode === 'edit' && props.initialData) {
      form.value = {
        orderId: props.initialData.orderId || '',
        orderNo: props.initialData.orderNo || '',
        exporter: props.initialData.exporter || '',
        importer: props.initialData.importer || '',
        goodsDescription: props.initialData.goodsDescription || '',
        hsCode: props.initialData.hsCode || '',
        declaredValue: props.initialData.declaredValue || 0,
        currency: props.initialData.currency || 'USD',
        weight: props.initialData.weight || 0,
        quantity: props.initialData.quantity || 0
      }
    } else {
      form.value = { ...defaultForm }
    }
  }
})

const handleOrderChange = () => {
  if (selectedOrder.value) {
    form.value.orderNo = selectedOrder.value.orderNo
    if (!form.value.goodsDescription && selectedOrder.value.skuList.length > 0) {
      form.value.goodsDescription = selectedOrder.value.skuList.map(s => s.name).join(', ')
    }
    if (!form.value.quantity && selectedOrder.value.skuList.length > 0) {
      form.value.quantity = selectedOrder.value.skuList.reduce((sum, s) => sum + s.quantity, 0)
    }
    if (!form.value.declaredValue) {
      form.value.declaredValue = selectedOrder.value.totalAmount
      form.value.currency = selectedOrder.value.currency
    }
  }
}

const validateForm = () => {
  if (props.mode === 'create' && !form.value.orderId) return '请选择关联订单'
  if (!form.value.exporter.trim()) return '请输入出口商'
  if (!form.value.importer.trim()) return '请输入进口商'
  if (!form.value.goodsDescription.trim()) return '请输入货物描述'
  if (!form.value.hsCode.trim()) return '请输入HS编码'
  if (!form.value.declaredValue || form.value.declaredValue <= 0) return '请输入正确的申报价值'
  if (!form.value.weight || form.value.weight <= 0) return '请输入正确的重量'
  if (!form.value.quantity || form.value.quantity <= 0) return '请输入正确的数量'
  return null
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  const error = validateForm()
  if (error) {
    alert(error)
    return
  }

  submitting.value = true
  try {
    const submitData = {
      ...form.value,
      version: props.mode === 'edit' && props.initialData ? props.initialData.version : 1,
      status: 'draft' as const,
      submitter: appStore.currentUser.name
    }
    emit('submit', submitData)
  } finally {
    submitting.value = false
  }
}
</script>
