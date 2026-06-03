<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const cards = ref<any[]>([])
const residents = ref<any[]>([])
const permissionGroups = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const showSimulateModal = ref(false)
const simulateResult = ref<any>(null)

const form = ref({
  cardNo: '', residentId: 0, permissionGroupId: 1,
  issueDate: dayjs().format('YYYY-MM-DD'), expireDate: '', remark: ''
})

const simulateForm = ref({ cardNo: '', doorName: '单元门' })

const loadData = async () => {
  loading.value = true
  try {
    const [cardsData, residentsData, groupsData] = await Promise.all([
      searchKeyword.value ? window.api.accessCard.search(searchKeyword.value) : window.api.accessCard.list(),
      window.api.resident.list(),
      window.api.permissionGroup.list()
    ])
    cards.value = cardsData
    residents.value = residentsData
    permissionGroups.value = groupsData
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openCreate = () => {
  form.value = {
    cardNo: 'CARD' + String(Date.now()).slice(-6),
    residentId: residents.value[0]?.id || 0,
    permissionGroupId: permissionGroups.value[0]?.id || 1,
    issueDate: dayjs().format('YYYY-MM-DD'),
    expireDate: '',
    remark: ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.cardNo || !form.value.residentId || !form.value.permissionGroupId) {
    alert('请填写必填项')
    return
  }
  try {
    await window.api.accessCard.create(form.value)
    showModal.value = false
    loadData()
  } catch (e: any) {
    alert('操作失败：' + e.message)
  }
}

const handleUpdateStatus = async (id: number, status: string, remark?: string) => {
  const confirmMsg = status === 'lost' ? '确定要挂失此卡吗？挂失后将无法使用。' :
    status === 'active' ? '确定要启用此卡吗？' :
    status === 'inactive' ? '确定要停用此卡吗？' : ''
  if (confirmMsg && !confirm(confirmMsg)) return
  await window.api.accessCard.updateStatus(id, status, remark)
  loadData()
}

const handleSimulateWrite = async (cardId: number) => {
  if (!confirm('将模拟写入门禁卡数据，是否继续？')) return
  const result = await window.api.accessCard.simulateWrite(cardId)
  alert(result.message)
  loadData()
}

const openSimulateAccess = () => {
  simulateForm.value = { cardNo: '', doorName: '单元门' }
  simulateResult.value = null
  showSimulateModal.value = true
}

const handleSimulateAccess = async () => {
  if (!simulateForm.value.cardNo) {
    alert('请输入卡号')
    return
  }
  simulateResult.value = await window.api.accessCard.simulateAccess(
    simulateForm.value.cardNo,
    simulateForm.value.doorName
  )
  loadData()
}

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-active', inactive: 'badge-inactive',
    lost: 'badge-lost', expired: 'badge-expired', pending: 'badge-pending'
  }
  return map[status] || ''
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '正常', inactive: '停用',
    lost: '已挂失', expired: '已过期', pending: '待写卡'
  }
  return map[status] || status
}

const doorOptions = ['小区大门', '单元门', '车库入口', '天台门', '设备层']
</script>

<template>
  <div>
    <div class="card mb-4">
      <div class="card-header">
        <div class="flex items-center gap-4">
          <div class="search-box">
            <input v-model="searchKeyword" placeholder="搜索卡号、姓名、电话..." />
          </div>
          <span class="text-gray">共 {{ cards.length }} 张卡</span>
        </div>
        <div class="flex gap-2">
          <button class="btn" @click="openSimulateAccess">🔓 模拟刷卡</button>
          <button class="btn btn-primary" @click="openCreate">+ 制卡</button>
        </div>
      </div>
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>卡号</th>
                <th>持卡人</th>
                <th>电话</th>
                <th>权限组</th>
                <th>状态</th>
                <th>发卡日期</th>
                <th>有效期</th>
                <th>最后使用</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="card in cards" :key="card.id" :class="{ 'row-highlight': card.remark && card.remark.includes('补办') }">
                <td class="font-mono"><strong>{{ card.cardNo }}</strong></td>
                <td>{{ card.residentName }}</td>
                <td>{{ card.phone }}</td>
                <td><span class="tag tag-primary">{{ card.permissionGroupName }}</span></td>
                <td><span class="badge" :class="getStatusBadge(card.status)">{{ getStatusLabel(card.status) }}</span></td>
                <td>{{ card.issueDate }}</td>
                <td>
                  <span v-if="card.expireDate">{{ card.expireDate }}</span>
                  <span v-else class="text-gray">长期</span>
                </td>
                <td class="text-sm text-gray">{{ card.lastUsed || '-' }}</td>
                <td class="text-sm" style="max-width: 200px;">
                  <span v-if="card.remark" class="text-blue" :title="card.remark">{{ card.remark }}</span>
                  <span v-else class="text-gray">-</span>
                </td>
                <td>
                  <div class="flex gap-2 flex-wrap">
                    <button v-if="card.status === 'pending'" class="btn btn-sm btn-success" @click="handleSimulateWrite(card.id)">
                      写卡激活
                    </button>
                    <button v-if="card.status === 'active'" class="btn btn-sm btn-warning" @click="handleUpdateStatus(card.id, 'inactive')">
                      停用
                    </button>
                    <button v-if="card.status === 'inactive' || card.status === 'expired'" class="btn btn-sm btn-success" @click="handleUpdateStatus(card.id, 'active')">
                      启用
                    </button>
                    <button v-if="card.status === 'active' || card.status === 'inactive'" class="btn btn-sm btn-danger" @click="handleUpdateStatus(card.id, 'lost', '用户申请挂失')">
                      挂失
                    </button>
                    <button v-if="card.status === 'lost'" class="btn btn-sm" @click="handleUpdateStatus(card.id, 'inactive', '找回并停用')">
                      找回
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="width: 550px;">
        <div class="modal-header">
          <h3 class="modal-title">新增门禁卡</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">卡号</label>
              <input v-model="form.cardNo" class="form-control" placeholder="自动生成或手动输入" />
            </div>
            <div class="form-group">
              <label class="form-label required">持卡人</label>
              <select v-model="form.residentId" class="form-control">
                <option v-for="r in residents" :key="r.id" :value="r.id">
                  {{ r.name }} ({{ r.building }}{{ r.unit }}{{ r.room }})
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">权限组</label>
              <select v-model="form.permissionGroupId" class="form-control">
                <option v-for="g in permissionGroups" :key="g.id" :value="g.id">
                  {{ g.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">发卡日期</label>
              <input v-model="form.issueDate" type="date" class="form-control" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">有效期至（选填，租客必填）</label>
              <input v-model="form.expireDate" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <input v-model="form.remark" class="form-control" placeholder="如：主卡、副卡等" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">创建</button>
        </div>
      </div>
    </div>

    <div v-if="showSimulateModal" class="modal-overlay" @click.self="showSimulateModal = false">
      <div class="modal" style="width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">🔓 模拟刷卡</h3>
          <button class="modal-close" @click="showSimulateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">卡号</label>
              <input v-model="simulateForm.cardNo" class="form-control" placeholder="请输入卡号，如 CARD000003" />
            </div>
            <div class="form-group">
              <label class="form-label required">门禁点</label>
              <select v-model="simulateForm.doorName" class="form-control">
                <option v-for="d in doorOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>

          <div v-if="simulateResult" class="mt-4">
            <div v-if="simulateResult.success" class="alert alert-success" style="background: #dcfce7; border-color: #86efac; color: #14532d;">
              <strong>✅ 刷卡成功</strong>
              <p class="text-sm mt-2">
                {{ simulateForm.cardNo }} 在 {{ simulateForm.doorName }} 刷卡成功，门已开启。
              </p>
            </div>
            <div v-else class="alert alert-danger">
              <strong>❌ 刷卡失败</strong>
              <p class="text-sm mt-2">
                失败原因：{{ simulateResult.reason || '未知错误' }}
              </p>
              <p v-if="simulateResult.card" class="text-sm mt-2">
                卡片状态：<span class="badge" :class="getStatusBadge(simulateResult.card.status)">
                  {{ getStatusLabel(simulateResult.card.status) }}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showSimulateModal = false">关闭</button>
          <button class="btn btn-primary" @click="handleSimulateAccess">模拟刷卡</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: 'SF Mono', Monaco, monospace;
}
.flex-wrap {
  flex-wrap: wrap;
}
</style>
