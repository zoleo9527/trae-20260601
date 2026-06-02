<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const groups = ref<any[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '', description: '',
  doors: [] as string[],
  elevators: [] as number[],
  hasGarage: false,
  garageZones: [] as string[]
})

const allDoors = ['小区大门', '单元门', '车库入口', '天台门', '设备层']
const allGarageZones = ['A区', 'B区', 'C区', 'VIP区']
const allFloors = Array.from({ length: 30 }, (_, i) => i + 1)

const loadData = async () => {
  loading.value = true
  try {
    groups.value = await window.api.permissionGroup.list()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openCreate = () => {
  editingId.value = null
  form.value = { name: '', description: '', doors: ['小区大门', '单元门'], elevators: [], hasGarage: false, garageZones: [] }
  showModal.value = true
}

const openEdit = (item: any) => {
  editingId.value = item.id
  form.value = {
    name: item.name, description: item.description || '',
    doors: [...item.doors], elevators: [...item.elevators],
    hasGarage: item.hasGarage, garageZones: [...item.garageZones]
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.name) {
    alert('请填写权限组名称')
    return
  }
  try {
    if (editingId.value) {
      await window.api.permissionGroup.update(editingId.value, form.value)
    } else {
      await window.api.permissionGroup.create(form.value)
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    alert('操作失败：' + e.message)
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除该权限组吗？正在使用该权限组的卡片将受影响。')) return
  await window.api.permissionGroup.delete(id)
  loadData()
}

const toggleDoor = (door: string) => {
  const idx = form.value.doors.indexOf(door)
  if (idx > -1) form.value.doors.splice(idx, 1)
  else form.value.doors.push(door)
}

const toggleGarageZone = (zone: string) => {
  const idx = form.value.garageZones.indexOf(zone)
  if (idx > -1) form.value.garageZones.splice(idx, 1)
  else form.value.garageZones.push(zone)
}

const toggleFloor = (floor: number) => {
  const idx = form.value.elevators.indexOf(floor)
  if (idx > -1) form.value.elevators.splice(idx, 1)
  else form.value.elevators.push(floor)
}

const selectAllFloors = () => {
  if (form.value.elevators.length === allFloors.length) {
    form.value.elevators = []
  } else {
    form.value.elevators = [...allFloors]
  }
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <span class="text-gray">共 {{ groups.length }} 个权限组</span>
        <button v-if="props.userRole === 'admin'" class="btn btn-primary" @click="openCreate">+ 新增权限组</button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="grid grid-cols-2 gap-4">
          <div v-for="group in groups" :key="group.id" class="card" style="margin-bottom: 0;">
            <div class="card-header">
              <div>
                <h3 class="card-title">{{ group.name }}</h3>
                <div class="text-sm text-gray mt-1">{{ group.description || '暂无描述' }}</div>
              </div>
              <div v-if="props.userRole === 'admin'" class="flex gap-2">
                <button class="btn btn-sm" @click="openEdit(group)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="handleDelete(group.id)">删除</button>
              </div>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="text-sm text-gray mb-2">可通行门：</div>
                <div>
                  <span v-for="door in group.doors" :key="door" class="tag tag-primary">{{ door }}</span>
                  <span v-if="group.doors.length === 0" class="text-gray">无</span>
                </div>
              </div>
              <div class="mb-3">
                <div class="text-sm text-gray mb-2">电梯楼层：</div>
                <div>
                  <span v-if="group.elevators.length === allFloors.length" class="tag tag-success">全部楼层</span>
                  <template v-else-if="group.elevators.length > 0">
                    <span v-for="floor in group.elevators" :key="floor" class="tag">{{ floor }}层</span>
                  </template>
                  <span v-else class="text-gray">无</span>
                </div>
              </div>
              <div v-if="group.hasGarage">
                <div class="text-sm text-gray mb-2">车库区域：</div>
                <div>
                  <span v-for="zone in group.garageZones" :key="zone" class="tag tag-success">{{ zone }}</span>
                  <span v-if="group.garageZones.length === 0" class="text-gray">无</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '编辑权限组' : '新增权限组' }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">名称</label>
              <input v-model="form.name" class="form-control" placeholder="如：标准住户权限" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <input v-model="form.description" class="form-control" placeholder="简要描述该权限组的适用范围" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">可通行门</label>
            <div class="flex gap-2 flex-wrap">
              <label v-for="door in allDoors" :key="door" class="checkbox-label">
                <input type="checkbox" :checked="form.doors.includes(door)" @change="toggleDoor(door)" />
                {{ door }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label required mb-0">电梯楼层权限</label>
              <button type="button" class="btn btn-sm" @click="selectAllFloors">
                {{ form.elevators.length === allFloors.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="flex gap-2 flex-wrap" style="max-height: 150px; overflow-y: auto; padding: 8px; background: var(--gray-50); border-radius: 6px;">
              <label v-for="floor in allFloors" :key="floor" class="checkbox-label">
                <input type="checkbox" :checked="form.elevators.includes(floor)" @change="toggleFloor(floor)" />
                {{ floor }}F
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="form.hasGarage" style="margin-right: 6px;" />
              包含车库权限
            </label>
          </div>

          <div v-if="form.hasGarage" class="form-group">
            <label class="form-label required">车库区域</label>
            <div class="flex gap-2 flex-wrap">
              <label v-for="zone in allGarageZones" :key="zone" class="checkbox-label">
                <input type="checkbox" :checked="form.garageZones.includes(zone)" @change="toggleGarageZone(zone)" />
                {{ zone }}
              </label>
            </div>
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

<style scoped>
.grid {
  display: grid;
}
.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.gap-4 {
  gap: 16px;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;
}
.checkbox-label:hover {
  border-color: var(--primary);
}
.checkbox-label input[type="checkbox"]:checked + * {
  color: var(--primary);
}
.checkbox-label:has(input:checked) {
  background: #dbeafe;
  border-color: var(--primary);
  color: var(--primary);
}
.flex-wrap {
  flex-wrap: wrap;
}
</style>
