<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const residents = ref<any[]>([])
const houses = ref<any[]>([])
const permissionGroups = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref<number | null>(null)
const detailData = ref<any>(null)

const form = ref({
  name: '', phone: '', idCard: '', type: 'tenant' as 'owner' | 'tenant' | 'family',
  houseId: 0, leaseStart: '', leaseEnd: '', remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const [residentsData, housesData, groupsData] = await Promise.all([
      searchKeyword.value ? window.api.resident.search(searchKeyword.value) : window.api.resident.list(),
      window.api.house.list(),
      window.api.permissionGroup.list()
    ])
    residents.value = residentsData
    houses.value = housesData
    permissionGroups.value = groupsData
  } finally {
    loading.value = false
  }
}

watch(searchKeyword, () => {
  loadData()
})

onMounted(loadData)

const openCreate = () => {
  editingId.value = null
  form.value = { name: '', phone: '', idCard: '', type: 'tenant', houseId: houses.value[0]?.id || 0, leaseStart: '', leaseEnd: '', remark: '' }
  showModal.value = true
}

const openEdit = (item: any) => {
  editingId.value = item.id
  form.value = {
    name: item.name, phone: item.phone, idCard: item.idCard, type: item.type,
    houseId: item.houseId, leaseStart: item.leaseStart || '', leaseEnd: item.leaseEnd || '', remark: item.remark || ''
  }
  showModal.value = true
}

const openDetail = async (id: number) => {
  detailData.value = await window.api.resident.getFullInfo(id)
  showDetailModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.phone || !form.value.idCard || !form.value.houseId) {
    alert('请填写必填项')
    return
  }

  try {
    if (editingId.value) {
      await window.api.resident.update(editingId.value, form.value)
    } else {
      await window.api.resident.create(form.value)
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    alert('操作失败：' + e.message)
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除该住户吗？关联的门禁卡也会被删除。')) return
  await window.api.resident.delete(id)
  loadData()
}

const handleImport = async () => {
  const result = await window.api.app.showOpenDialog({
    title: '选择住户CSV文件',
    filters: [{ name: 'CSV文件', extensions: ['csv'] }],
    properties: ['openFile']
  })
  if (!result.canceled && result.filePaths[0]) {
    const res = await window.api.resident.importCsv(result.filePaths[0])
    alert(`导入完成：成功 ${res.imported} 条，失败 ${res.failed} 条`)
    loadData()
  }
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = { owner: '业主', tenant: '租客', family: '家属' }
  return map[type] || type
}

const getTypeBadge = (type: string) => {
  const map: Record<string, string> = { owner: 'badge-owner', tenant: 'badge-tenant', family: 'badge-family' }
  return map[type] || ''
}

const getHouseLabel = (houseId: number) => {
  const h = houses.value.find(h => h.id === houseId)
  return h ? `${h.building}${h.unit}单元${h.room}` : '-'
}

const isExpiringSoon = (leaseEnd: string) => {
  if (!leaseEnd) return false
  const days = dayjs(leaseEnd).diff(dayjs(), 'day')
  return days >= 0 && days <= 90
}

const isExpired = (leaseEnd: string) => {
  if (!leaseEnd) return false
  return dayjs(leaseEnd).isBefore(dayjs(), 'day')
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '正常', inactive: '停用', lost: '已挂失', expired: '已过期', pending: '待激活'
  }
  return map[status] || status
}

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-active', inactive: 'badge-inactive',
    lost: 'badge-lost', expired: 'badge-expired', pending: 'badge-pending'
  }
  return map[status] || ''
}
</script>

<template>
  <div>
    <div class="card mb-4">
      <div class="card-header">
        <div class="flex items-center gap-4">
          <div class="search-box">
            <input v-model="searchKeyword" placeholder="搜索姓名、电话、身份证、房号..." />
          </div>
          <span class="text-gray">共 {{ residents.length }} 条记录</span>
        </div>
        <div class="flex gap-2">
          <button class="btn" @click="handleImport">📥 导入CSV</button>
          <button class="btn btn-primary" @click="openCreate">+ 新增住户</button>
        </div>
      </div>
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else-if="residents.length === 0" class="empty">暂无住户数据</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>类型</th>
                <th>电话</th>
                <th>房屋</th>
                <th>租约日期</th>
                <th>门禁卡</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in residents" :key="item.id">
                <td>
                  <strong>{{ item.name }}</strong>
                  <div class="text-sm text-gray">{{ item.idCard }}</div>
                </td>
                <td><span class="badge" :class="getTypeBadge(item.type)">{{ getTypeLabel(item.type) }}</span></td>
                <td>{{ item.phone }}</td>
                <td>{{ item.building }}{{ item.unit }}单元{{ item.room }}</td>
                <td>
                  <span v-if="item.leaseStart && item.leaseEnd">
                    {{ item.leaseStart }} ~ {{ item.leaseEnd }}
                    <span v-if="isExpired(item.leaseEnd)" class="text-danger">（已过期）</span>
                    <span v-else-if="isExpiringSoon(item.leaseEnd)" class="text-warning">（即将到期）</span>
                  </span>
                  <span v-else class="text-gray">-</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="openDetail(item.id)">查看详情</button>
                </td>
                <td class="text-sm text-gray">{{ item.remark || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-sm" @click="openDetail(item.id)">详情</button>
                    <button class="btn btn-sm" @click="openEdit(item)">编辑</button>
                    <button v-if="props.userRole === 'admin'" class="btn btn-sm btn-danger" @click="handleDelete(item.id)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '编辑住户' : '新增住户' }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">姓名</label>
              <input v-model="form.name" class="form-control" placeholder="请输入姓名" />
            </div>
            <div class="form-group">
              <label class="form-label required">类型</label>
              <select v-model="form.type" class="form-control">
                <option value="owner">业主</option>
                <option value="tenant">租客</option>
                <option value="family">家属</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">手机号</label>
              <input v-model="form.phone" class="form-control" placeholder="请输入手机号" />
            </div>
            <div class="form-group">
              <label class="form-label required">身份证号</label>
              <input v-model="form.idCard" class="form-control" placeholder="请输入身份证号" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required">房屋</label>
            <select v-model="form.houseId" class="form-control">
              <option v-for="h in houses" :key="h.id" :value="h.id">
                {{ h.building }}{{ h.unit }}单元{{ h.room }}
              </option>
            </select>
          </div>
          <div v-if="form.type === 'tenant'" class="form-row">
            <div class="form-group">
              <label class="form-label">起租日期</label>
              <input v-model="form.leaseStart" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">到期日期</label>
              <input v-model="form.leaseEnd" type="date" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="form.remark" class="form-control" rows="2" placeholder="选填"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">{{ editingId ? '保存' : '创建' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal && detailData" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal" style="width: 800px;">
        <div class="modal-header">
          <h3 class="modal-title">住户详情 - {{ detailData.resident.name }}</h3>
          <button class="modal-close" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert" v-if="detailData.resident.type === 'tenant' && isExpiringSoon(detailData.resident.leaseEnd)" :class="isExpired(detailData.resident.leaseEnd) ? 'alert-danger' : 'alert-warning'">
            <div>
              <strong>⚠️ 租约{{ isExpired(detailData.resident.leaseEnd) ? '已过期' : '即将到期' }}</strong>
              <p class="text-sm mt-2">
                租约将于 {{ detailData.resident.leaseEnd }} 到期，请及时处理。
              </p>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="mb-2">基本信息</h4>
            <div class="grid grid-cols-3 gap-3">
              <div><span class="text-gray">姓名：</span>{{ detailData.resident.name }}</div>
              <div><span class="text-gray">类型：</span><span class="badge" :class="getTypeBadge(detailData.resident.type)">{{ getTypeLabel(detailData.resident.type) }}</span></div>
              <div><span class="text-gray">电话：</span>{{ detailData.resident.phone }}</div>
              <div><span class="text-gray">身份证：</span>{{ detailData.resident.idCard }}</div>
              <div class="col-span-2"><span class="text-gray">房屋：</span>{{ detailData.house.building }}{{ detailData.house.unit }}单元{{ detailData.house.room }}（{{ detailData.house.area }}㎡）</div>
              <div v-if="detailData.resident.leaseStart"><span class="text-gray">租期：</span>{{ detailData.resident.leaseStart }} ~ {{ detailData.resident.leaseEnd }}</div>
              <div v-if="detailData.resident.remark" class="col-span-3"><span class="text-gray">备注：</span>{{ detailData.resident.remark }}</div>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="mb-2">门禁卡 ({{ detailData.cards.length }} 张)</h4>
            <table class="table-wrapper">
              <thead>
                <tr>
                  <th>卡号</th>
                  <th>权限组</th>
                  <th>状态</th>
                  <th>发卡日期</th>
                  <th>有效期</th>
                  <th>最后使用</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="card in detailData.cards" :key="card.id" :class="{ 'row-highlight': card.remark && (card.remark.includes('补办') || card.remark.includes('被补办')) }">
                  <td class="font-mono">{{ card.cardNo }}</td>
                  <td>{{ card.permissionGroupName }}</td>
                  <td><span class="badge" :class="getStatusBadge(card.status)">{{ getStatusLabel(card.status) }}</span></td>
                  <td>{{ card.issueDate }}</td>
                  <td>{{ card.expireDate || '长期' }}</td>
                  <td class="text-sm text-gray">{{ card.lastUsed || '-' }}</td>
                  <td class="text-sm">
                    <span v-if="card.remark" class="text-blue" :title="card.remark">{{ card.remark }}</span>
                    <span v-else class="text-gray">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="detailData.applications.length > 0">
            <h4 class="mb-2">申请记录</h4>
            <table class="table-wrapper">
              <thead>
                <tr>
                  <th>申请类型</th>
                  <th>权限组</th>
                  <th>状态</th>
                  <th>原因</th>
                  <th>审核意见</th>
                  <th>申请时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in detailData.applications" :key="app.id">
                  <td>{{ app.type === 'new' ? '新办卡' : app.type === 'reissue' ? '补办' : '权限变更' }}</td>
                  <td>{{ app.permissionGroupName }}</td>
                  <td><span class="badge" :class="'badge-' + app.status">{{ app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已拒绝' : '已完成' }}</span></td>
                  <td class="text-sm">{{ app.reason }}</td>
                  <td class="text-sm text-gray">{{ app.reviewComment || '-' }}</td>
                  <td class="text-sm text-gray">{{ app.createdAt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.col-span-2 {
  grid-column: span 2;
}
.col-span-3 {
  grid-column: span 3;
}
.gap-3 {
  gap: 12px;
}
.font-mono {
  font-family: 'SF Mono', Monaco, monospace;
}
</style>
