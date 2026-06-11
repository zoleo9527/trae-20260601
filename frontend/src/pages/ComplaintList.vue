<template>
  <div class="complaint-list">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">客诉退换管理</h2>
        <p class="page-desc">登记、跟踪和处理专柜客诉退换流程，全链路留痕可追溯</p>
      </div>
      <div class="header-right">
        <div class="role-switcher">
          <span class="switcher-label">切换角色：</span>
          <button
            v-for="role in ROLES"
            :key="role.key"
            class="role-btn"
            :class="{ active: roleStore.currentRole.key === role.key }"
            @click="roleStore.setRole(role.key)"
          >
            {{ role.label }}
          </button>
        </div>
        <button
          class="btn btn-primary"
          :class="{ disabled: roleStore.currentRole.key !== 'manager' }"
          :title="roleStore.currentRole.key !== 'manager' ? '柜长岗位才能新建客诉单' : ''"
          @click="onCreateClick"
        >
          <span class="btn-icon">+</span>新建客诉单
        </button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card" v-for="stat in stats" :key="stat.key" :style="{ borderTopColor: stat.color }">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
      </div>
    </div>

    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">处理状态</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">全部状态</option>
            <option v-for="cfg in Object.values(STATUS_CONFIG)" :key="cfg.key" :value="cfg.key">
              {{ cfg.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">客诉类型</label>
          <select v-model="filters.type" class="filter-select">
            <option value="">全部类型</option>
            <option v-for="(label, key) in COMPLAINT_TYPE_CONFIG" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">所在楼层</label>
          <select v-model="filters.floor" class="filter-select">
            <option value="">全部楼层</option>
            <option v-for="f in floors" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <div class="filter-item flex-2">
          <label class="filter-label">搜索</label>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.keyword"
              type="text"
              class="search-input"
              placeholder="搜索单号、品牌、顾客姓名、商品名称..."
            />
            <button v-if="filters.keyword" class="search-clear" @click="filters.keyword = ''">×</button>
          </div>
        </div>
      </div>
    </div>

    <div class="list-card">
      <template v-if="filteredList.length > 0">
        <div class="list-table">
          <div class="table-head">
            <div class="col col-no">单号</div>
            <div class="col col-brand">品牌/专柜</div>
            <div class="col col-customer">顾客信息</div>
            <div class="col col-product">商品</div>
            <div class="col col-type">类型</div>
            <div class="col col-status">状态</div>
            <div class="col col-handler">当前处理人</div>
            <div class="col col-time">提交时间</div>
            <div class="col col-action">操作</div>
          </div>
          <div class="table-body">
            <div
              v-for="item in filteredList"
              :key="item.id"
              class="table-row"
              @click="goDetail(item.id)"
            >
              <div class="col col-no">
                <span class="no-text">{{ item.complaintNo }}</span>
                <div class="no-meta">
                  <span v-if="item.returnCount > 0" class="meta-tag tag-red">退{{ item.returnCount }}</span>
                  <span v-if="item.recheckCount > 0" class="meta-tag tag-yellow">核{{ item.recheckCount }}</span>
                </div>
              </div>
              <div class="col col-brand">
                <div class="brand-name">{{ item.brand }}</div>
                <div class="counter-info">{{ item.counter }}</div>
              </div>
              <div class="col col-customer">
                <div class="customer-name">{{ item.customerName }}</div>
                <div class="customer-phone">{{ item.customerPhone }}</div>
              </div>
              <div class="col col-product">
                <div class="product-name">{{ item.productName }}</div>
                <div class="product-price">¥{{ item.productPrice.toLocaleString() }}</div>
              </div>
              <div class="col col-type">
                <span class="type-tag">{{ COMPLAINT_TYPE_CONFIG[item.type] }}</span>
              </div>
              <div class="col col-status">
                <span
                  class="status-tag"
                  :style="{
                    color: STATUS_CONFIG[item.status].color,
                    background: STATUS_CONFIG[item.status].bgColor
                  }"
                >
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
              </div>
              <div class="col col-handler">
                <span
                  class="handler-badge"
                  :class="item.currentHandlerRole"
                >
                  {{ item.currentHandler }}
                </span>
              </div>
              <div class="col col-time">
                {{ formatDate(item.submitTime) }}
              </div>
              <div class="col col-action" @click.stop>
                <button class="link-btn" @click="goDetail(item.id)">查看详情</button>
              </div>
            </div>
          </div>
        </div>
        <div class="list-footer">
          <span class="total-text">共 {{ filteredList.length }} 条记录</span>
        </div>
      </template>

      <template v-else>
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">暂无客诉记录</div>
          <div class="empty-desc">
            {{ hasAnyFilter ? '当前筛选条件下没有找到匹配的记录，请尝试调整筛选条件' : '还没有客诉单，点击右上角按钮新建' }}
          </div>
          <div class="empty-actions">
            <button v-if="hasAnyFilter" class="btn btn-outline" @click="resetFilters">
              重置筛选
            </button>
            <button
              class="btn btn-primary"
              :class="{ disabled: roleStore.currentRole.key !== 'manager' }"
              :title="roleStore.currentRole.key !== 'manager' ? '柜长岗位才能新建客诉单' : ''"
              @click="onCreateClick"
            >
              <span class="btn-icon">+</span>新建客诉单
            </button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">新建客诉单</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item">
              <label class="form-label required">客诉类型</label>
              <select v-model="formData.type" class="form-select">
                <option value="">请选择类型</option>
                <option v-for="(label, key) in COMPLAINT_TYPE_CONFIG" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label required">品牌</label>
              <input v-model="formData.brand" type="text" class="form-input" placeholder="如：雅诗兰黛" />
            </div>
            <div class="form-item">
              <label class="form-label required">专柜</label>
              <input v-model="formData.counter" type="text" class="form-input" placeholder="如：A座1F-12" />
            </div>
            <div class="form-item">
              <label class="form-label required">楼层</label>
              <select v-model="formData.floor" class="form-select">
                <option value="">请选择楼层</option>
                <option v-for="f in floors" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label required">顾客姓名</label>
              <input v-model="formData.customerName" type="text" class="form-input" placeholder="请输入姓名" />
            </div>
            <div class="form-item">
              <label class="form-label required">联系电话</label>
              <input v-model="formData.customerPhone" type="text" class="form-input" placeholder="请输入手机号" />
            </div>
            <div class="form-item">
              <label class="form-label required">商品名称</label>
              <input v-model="formData.productName" type="text" class="form-input" placeholder="请输入商品名称" />
            </div>
            <div class="form-item">
              <label class="form-label required">商品价格(元)</label>
              <input v-model.number="formData.productPrice" type="number" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-item">
              <label class="form-label required">购买日期</label>
              <input v-model="formData.purchaseDate" type="date" class="form-input" />
            </div>
            <div class="form-item">
              <label class="form-label required">投诉日期</label>
              <input v-model="formData.complaintDate" type="date" class="form-input" />
            </div>
            <div v-if="formData.type === 'refund'" class="form-item">
              <label class="form-label">退款金额(元)</label>
              <input v-model.number="formData.refundAmount" type="number" class="form-input" placeholder="可留空，后续协商" />
            </div>
            <div v-if="formData.type === 'exchange'" class="form-item">
              <label class="form-label">换货商品</label>
              <input v-model="formData.exchangeProduct" type="text" class="form-input" placeholder="换货目标商品" />
            </div>
            <div class="form-item col-span-2">
              <label class="form-label required">客诉详情</label>
              <textarea
                v-model="formData.complaintContent"
                class="form-textarea"
                rows="4"
                placeholder="请详细描述客诉问题、顾客诉求等..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate">提交客诉单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useComplaintStore } from '@/stores/complaint'
import { useRoleStore } from '@/stores/role'
import {
  STATUS_CONFIG,
  COMPLAINT_TYPE_CONFIG,
  ROLES,
  type ComplaintType,
  type ComplaintStatus,
  type Complaint
} from '@/types'

const router = useRouter()
const complaintStore = useComplaintStore()
const roleStore = useRoleStore()

const showCreateModal = ref(false)

const filters = reactive({
  status: '' as ComplaintStatus | '',
  type: '' as ComplaintType | '',
  floor: '',
  keyword: ''
})

const today = new Date().toISOString().split('T')[0]
const formData = reactive({
  type: '' as ComplaintType,
  brand: '',
  counter: '',
  floor: '',
  customerName: '',
  customerPhone: '',
  productName: '',
  productPrice: 0,
  purchaseDate: today,
  complaintDate: today,
  complaintContent: '',
  refundAmount: undefined as number | undefined,
  exchangeProduct: ''
})

const allComplaints = computed(() => complaintStore.getList())

const floors = computed(() => {
  const set = new Set(allComplaints.value.map(c => c.floor))
  return Array.from(set)
})

const stats = computed(() => {
  const list = allComplaints.value
  return [
    { key: 'total', label: '全部客诉', value: list.length, color: '#4a5568' },
    { key: 'my', label: '待我处理', value: list.filter(c => c.currentHandlerRole === roleStore.currentRole.key).length, color: '#e53e3e' },
    { key: 'pending', label: '处理中', value: list.filter(c => !['completed', 'cancelled'].includes(c.status)).length, color: '#ed8936' },
    { key: 'completed', label: '已完成', value: list.filter(c => c.status === 'completed').length, color: '#38a169' }
  ]
})

const hasAnyFilter = computed(() => {
  return filters.status || filters.type || filters.floor || filters.keyword
})

const filteredList = computed(() => {
  let list = [...allComplaints.value]

  if (filters.status) {
    list = list.filter(c => c.status === filters.status)
  }
  if (filters.type) {
    list = list.filter(c => c.type === filters.type)
  }
  if (filters.floor) {
    list = list.filter(c => c.floor === filters.floor)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(c =>
      c.complaintNo.toLowerCase().includes(kw) ||
      c.brand.toLowerCase().includes(kw) ||
      c.customerName.toLowerCase().includes(kw) ||
      c.productName.toLowerCase().includes(kw)
    )
  }

  return list.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime())
})

function resetFilters() {
  filters.status = ''
  filters.type = ''
  filters.floor = ''
  filters.keyword = ''
}

function goDetail(id: string) {
  router.push(`/complaint/${id}`)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

function validateForm(): boolean {
  if (!formData.type) { alert('请选择客诉类型'); return false }
  if (!formData.brand) { alert('请输入品牌'); return false }
  if (!formData.counter) { alert('请输入专柜'); return false }
  if (!formData.floor) { alert('请选择楼层'); return false }
  if (!formData.customerName) { alert('请输入顾客姓名'); return false }
  if (!formData.customerPhone) { alert('请输入联系电话'); return false }
  if (!formData.productName) { alert('请输入商品名称'); return false }
  if (!formData.productPrice || formData.productPrice <= 0) { alert('请输入正确的商品价格'); return false }
  if (!formData.purchaseDate) { alert('请选择购买日期'); return false }
  if (!formData.complaintDate) { alert('请选择投诉日期'); return false }
  if (!formData.complaintContent) { alert('请填写客诉详情'); return false }
  return true
}

function onCreateClick() {
  if (roleStore.currentRole.key !== 'manager') {
    alert(`当前身份为${roleStore.currentRole.value.label}，柜长岗位才能新建客诉单。\n请切换角色后再操作。`)
    return
  }
  showCreateModal.value = true
}

function handleCreate() {
  if (!validateForm()) return

  const seq = String(allComplaints.value.length + 1).padStart(3, '0')
  const datePart = today.replace(/-/g, '')
  const complaintNo = `TS-${datePart}-${seq}`

  const data = {
    complaintNo,
    type: formData.type as ComplaintType,
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    brand: formData.brand,
    counter: formData.counter,
    floor: formData.floor,
    productName: formData.productName,
    productPrice: formData.productPrice,
    purchaseDate: formData.purchaseDate,
    complaintDate: formData.complaintDate,
    complaintContent: formData.complaintContent,
    refundAmount: formData.refundAmount,
    exchangeProduct: formData.exchangeProduct || undefined
  }

  const newItem = complaintStore.createComplaint(
    data as Partial<Complaint> & any,
    roleStore.currentRole.key
  )
  if (!newItem) {
    alert('创建失败：仅柜长岗位可发起客诉单。请切换至柜长角色后重试。')
    return
  }
  showCreateModal.value = false
  router.push(`/complaint/${newItem.id}`)
}
</script>

<style scoped>
.complaint-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 6px 0;
}

.page-desc {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.role-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.switcher-label {
  font-size: 13px;
  color: #718096;
}

.role-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  background: #edf2f7;
  color: #4a5568;
  transition: all 0.2s;
}

.role-btn:hover {
  background: #e2e8f0;
}

.role-btn.active {
  background: #2c5282;
  color: white;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #2c5282;
  color: white;
}

.btn-primary:hover {
  background: #1e3a5f;
}

.btn.disabled {
  background: #a0aec0;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn.disabled:hover {
  background: #a0aec0;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-outline:hover {
  background: #f7fafc;
}

.btn-icon {
  font-size: 16px;
  font-weight: 600;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-top: 3px solid;
}

.stat-label {
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.filter-card, .list-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-card {
  padding: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 180px;
}

.flex-2 {
  flex: 2;
  min-width: 300px;
}

.filter-label {
  display: block;
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 6px;
  font-weight: 500;
}

.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #718096;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: #cbd5e0;
}

.list-table {
  overflow-x: auto;
}

.table-head, .table-row {
  display: grid;
  grid-template-columns: 140px 140px 120px 180px 80px 140px 100px 120px 90px;
  gap: 12px;
  padding: 14px 20px;
  align-items: center;
}

.table-head {
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.table-body {
  border-bottom: 1px solid #e2e8f0;
}

.table-row {
  border-bottom: 1px solid #f0f4f8;
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: #f7fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.no-text {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 13px;
  color: #2c5282;
  font-weight: 500;
}

.no-meta {
  margin-top: 4px;
  display: flex;
  gap: 4px;
}

.meta-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-red {
  background: #fed7d7;
  color: #c53030;
}

.tag-yellow {
  background: #fefcbf;
  color: #975a16;
}

.brand-name {
  font-weight: 500;
  color: #2d3748;
}

.counter-info {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.customer-name {
  font-weight: 500;
  color: #2d3748;
}

.customer-phone {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.product-name {
  color: #2d3748;
  font-size: 13px;
}

.product-price {
  font-size: 12px;
  color: #e53e3e;
  margin-top: 2px;
  font-weight: 500;
}

.type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 500;
}

.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.handler-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.handler-badge.manager {
  background: #fef5e7;
  color: #9c4221;
}

.handler-badge.supervisor {
  background: #ebf8ff;
  color: #2b6cb0;
}

.handler-badge.superintendent {
  background: #f0fff4;
  color: #276749;
}

.col-time {
  font-size: 13px;
  color: #718096;
}

.link-btn {
  color: #2c5282;
  background: none;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 500;
}

.link-btn:hover {
  text-decoration: underline;
}

.list-footer {
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
  color: #718096;
}

.empty-state {
  padding: 80px 40px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 24px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f7fafc;
  font-size: 20px;
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #edf2f7;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.col-span-2 {
  grid-column: span 2;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: #e53e3e;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background: white;
  transition: all 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}
</style>
