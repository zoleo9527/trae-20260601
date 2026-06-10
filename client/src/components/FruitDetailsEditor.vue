<script setup lang="ts">
import { ref, watch } from 'vue'
import { fruitApi } from '@/api'
import type { Fruit, FruitDetailItem } from '@/types'

const props = defineProps<{
  modelValue: FruitDetailItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FruitDetailItem[]]
}>()

const fruits = ref<Fruit[]>([])
const items = ref<FruitDetailItem[]>([])

async function loadFruits() {
  try {
    const data = await fruitApi.getList()
    fruits.value = data
  } catch (e) {
    console.error('加载果品失败:', e)
  }
}

function addItem() {
  if (fruits.value.length === 0) return
  const first = fruits.value[0]
  items.value.push({
    fruit_id: first.id,
    fruit_name: first.name,
    weight: 0,
    unit: first.unit,
    price: first.price
  })
  emitValue()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  emitValue()
}

function updateFruit(index: number, fruitId: number) {
  const fruit = fruits.value.find(f => f.id === fruitId)
  if (fruit) {
    items.value[index].fruit_id = fruit.id
    items.value[index].fruit_name = fruit.name
    items.value[index].unit = fruit.unit
    items.value[index].price = fruit.price
  }
  emitValue()
}

function emitValue() {
  emit('update:modelValue', [...items.value])
}

const totalWeight = ref(0)

function calcTotal() {
  totalWeight.value = items.value.reduce((sum, item) => sum + (item.weight || 0), 0)
}

watch(items, () => {
  calcTotal()
  emitValue()
}, { deep: true })

watch(() => props.modelValue, (val) => {
  if (val && val.length > 0 && items.value.length === 0) {
    items.value = [...val]
  }
}, { immediate: true })

loadFruits()
</script>

<template>
  <div>
    <table class="data-table" style="margin-bottom: 12px;">
      <thead>
        <tr>
          <th>果品</th>
          <th>数量</th>
          <th>单位</th>
          <th>单价</th>
          <th style="width: 80px;" v-if="!readonly">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>
            <select
              v-if="!readonly"
              v-model="item.fruit_id"
              @change="updateFruit(index, item.fruit_id)"
              class="form-select"
              style="width: 140px;"
            >
              <option v-for="f in fruits" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
            <span v-else>{{ item.fruit_name }}</span>
          </td>
          <td>
            <input
              v-if="!readonly"
              v-model.number="item.weight"
              type="number"
              step="0.1"
              min="0"
              class="form-input"
              style="width: 100px;"
            />
            <span v-else>{{ item.weight }}</span>
          </td>
          <td>{{ item.unit }}</td>
          <td>¥{{ item.price }}</td>
          <td v-if="!readonly">
            <button class="btn btn-sm btn-link" style="color: #ff4d4f;" @click="removeItem(index)">删除</button>
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="5" style="text-align: center; color: #999; padding: 20px;">
            暂无果品明细
          </td>
        </tr>
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="color: #666; font-size: 13px;">
        合计：<strong style="color: #1890ff; font-size: 16px;">{{ totalWeight.toFixed(1) }}</strong>
        <span v-if="items.length > 0">{{ items[0].unit }}</span>
      </div>
      <button v-if="!readonly" class="btn btn-sm" @click="addItem">+ 添加果品</button>
    </div>
  </div>
</template>
