<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const houses = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  building: '1号楼', unit: '1单元', room: '', floor: 1, area: 90, ownerId: null as number | null
})

const loadData = async () => {
  loading.value = true
  try {
    houses.value = searchKeyword.value
      ? await window.api.house.search(searchKeyword.value)
      : await window.api.house.list()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openCreate = () => {
  editingId.value = null
  form.value = { building: '1号楼', unit: '1单元', room: '', floor: 1, area: 90, ownerId: null }
  showModal.value = true
}

const openEdit = (item: any) => {
  editingId.value = item.id
  form.value = {
    building: item.building, unit: item.unit, room: item.room,
    floor: item.floor, area: item.area, ownerId: item.ownerId
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.room) {
    alert('请填写房号')
    return
  }
  try {
    if (editingId.value) {
      await window.api.house.update(editingId.value, form.value)
    } else {
      await window.api.house.create(form.value)
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    alert('操作失败：' + e.message)
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除该房屋吗？')) return
  await window.api.house.delete(id)
  loadData()
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <div class="flex items-center gap-4">
          <div class="search-box">
            <input v-model="searchKeyword" placeholder="搜索楼栋、单元、房号、业主..." @keyup.enter="loadData" />
            <button class="btn btn-primary" @click="loadData">搜索</button>
          </div>
          <span class="text-gray">共 {{ houses.length }} 套房屋</span>
        </div>
        <button v-if="props.userRole === 'admin'" class="btn btn-primary" @click="openCreate">+ 新增房屋</button>
      </div>
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>楼栋</th>
                <th>单元</th>
                <th>房号</th>
                <th>楼层</th>
                <th>面积</th>
                <th>业主</th>
                <th>业主电话</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in houses" :key="item.id">
                <td>{{ item.building }}</td>
                <td>{{ item.unit }}</td>
                <td><strong>{{ item.room }}</strong></td>
                <td>{{ item.floor }}层</td>
                <td>{{ item.area }}㎡</td>
                <td>{{ item.ownerName || '-' }}</td>
                <td>{{ item.ownerPhone || '-' }}</td>
                <td>
                  <button v-if="props.userRole === 'admin'" class="btn btn-sm" @click="openEdit(item)">编辑</button>
                  <button v-if="props.userRole === 'admin'" class="btn btn-sm btn-danger" @click="handleDelete(item.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '编辑房屋' : '新增房屋' }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">楼栋</label>
              <select v-model="form.building" class="form-control">
                <option v-for="b in 5" :key="b" :value="`${b}号楼`">{{ b }}号楼</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">单元</label>
              <select v-model="form.unit" class="form-control">
                <option v-for="u in 3" :key="u" :value="`${u}单元`">{{ u }}单元</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">房号</label>
              <input v-model="form.room" class="form-control" placeholder="如：1501室" />
            </div>
            <div class="form-group">
              <label class="form-label required">楼层</label>
              <input v-model.number="form.floor" type="number" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">面积（㎡）</label>
            <input v-model.number="form.area" type="number" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">{{ editingId ? '保存' : '创建' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
