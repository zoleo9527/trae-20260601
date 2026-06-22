<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import StatusBadge from '@/components/StatusBadge.vue'

const store = useDataStore()

const activeTab = ref('categories')
const newPrice = ref(0)
const priceReason = ref('')
const editingCategoryId = ref<string | null>(null)

function startEditPrice(catId: string) {
  const cat = store.categories.find(c => c.id === catId)
  if (cat) {
    editingCategoryId.value = catId
    newPrice.value = cat.defaultPrice
    priceReason.value = ''
  }
}

function cancelEditPrice() {
  editingCategoryId.value = null
}

function savePrice() {
  if (!editingCategoryId.value) return
  if (!priceReason.value.trim()) {
    alert('请填写价格变动原因')
    return
  }
  store.updateCategoryPrice(editingCategoryId.value, newPrice.value, priceReason.value)
  editingCategoryId.value = null
}

async function handleExport() {
  const success = await store.exportAllData()
  if (success) {
    alert('导出成功')
  }
}

async function handleImport() {
  if (!confirm('导入数据将覆盖现有数据，确定要继续吗？')) return
  try {
    const success = await store.importAllData()
    if (success) {
      alert('导入成功')
    } else {
      alert('导入失败或已取消')
    }
  } catch (e) {
    alert('导入失败: ' + (e as Error).message)
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h2 class="page-title">⚙️ 设置</h2>
    </div>

    <div class="settings-tabs">
      <div
        :class="['tab-item', { active: activeTab === 'categories' }]"
        @click="activeTab = 'categories'"
      >
        📦 品类管理
      </div>
      <div
        :class="['tab-item', { active: activeTab === 'priceChanges' }]"
        @click="activeTab = 'priceChanges'"
      >
        💰 价格变动记录
      </div>
      <div
        :class="['tab-item', { active: activeTab === 'importExport' }]"
        @click="activeTab = 'importExport'"
      >
        📤 导入导出
      </div>
      <div
        :class="['tab-item', { active: activeTab === 'users' }]"
        @click="activeTab = 'users'"
      >
        👥 用户角色
      </div>
    </div>

    <div class="settings-content card">
      <div v-if="activeTab === 'categories'" class="tab-content">
        <div class="section-title">品类列表</div>
        <table class="table">
          <thead>
            <tr>
              <th>品类名称</th>
              <th>编码</th>
              <th>单位</th>
              <th>当前单价 (元/kg)</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in store.categories" :key="cat.id">
              <td class="font-medium">{{ cat.name }}</td>
              <td class="mono">{{ cat.code }}</td>
              <td>{{ cat.unit }}</td>
              <td>
                <template v-if="editingCategoryId === cat.id">
                  <input
                    v-model.number="newPrice"
                    type="number"
                    class="form-input price-input"
                    step="0.01"
                  />
                </template>
                <template v-else>
                  <span class="price-value">¥{{ cat.defaultPrice.toFixed(2) }}</span>
                </template>
              </td>
              <td class="text-secondary text-sm">{{ cat.description || '-' }}</td>
              <td>
                <template v-if="editingCategoryId === cat.id">
                  <button class="btn btn-sm" @click="cancelEditPrice">取消</button>
                  <button class="btn btn-primary btn-sm ml-8" @click="savePrice">保存</button>
                </template>
                <template v-else>
                  <button class="btn btn-sm" @click="startEditPrice(cat.id)">调整价格</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="editingCategoryId" class="price-reason-box">
          <div class="form-item">
            <label class="form-label">价格变动原因 <span class="required">*</span></label>
            <textarea
              v-model="priceReason"
              class="form-textarea"
              rows="2"
              placeholder="请说明价格调整的原因，将记入价格变动历史"
            ></textarea>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'priceChanges'" class="tab-content">
        <div class="section-title">价格变动历史</div>
        <div v-if="store.priceChanges.length === 0" class="empty-tip">
          暂无价格变动记录
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>品类</th>
              <th>原价格</th>
              <th>新价格</th>
              <th>变动幅度</th>
              <th>调整人</th>
              <th>调整时间</th>
              <th>原因</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pc in store.priceChanges" :key="pc.id">
              <td class="font-medium">{{ pc.categoryName }}</td>
              <td class="mono">¥{{ pc.oldPrice.toFixed(2) }}</td>
              <td class="mono font-medium">¥{{ pc.newPrice.toFixed(2) }}</td>
              <td>
                <span
                  :class="pc.newPrice > pc.oldPrice ? 'text-error' : 'text-success'"
                  class="font-medium"
                >
                  {{ pc.newPrice > pc.oldPrice ? '↑' : '↓' }}
                  {{ (Math.abs(pc.newPrice - pc.oldPrice) / pc.oldPrice * 100).toFixed(1) }}%
                </span>
              </td>
              <td>{{ pc.changedBy }}</td>
              <td class="text-secondary text-sm">{{ pc.changedAt }}</td>
              <td class="text-secondary">{{ pc.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'importExport'" class="tab-content">
        <div class="section-title">数据导入导出</div>
        <div class="ie-section">
          <div class="ie-card">
            <div class="ie-icon">📤</div>
            <div class="ie-info">
              <div class="ie-title">导出数据</div>
              <div class="ie-desc">
                将所有业务数据导出为 JSON 文件，包括进厂登记、过磅复核、争议记录、操作日志等
              </div>
            </div>
            <button class="btn btn-primary" @click="handleExport">导出</button>
          </div>

          <div class="ie-card danger">
            <div class="ie-icon">📥</div>
            <div class="ie-info">
              <div class="ie-title">导入数据</div>
              <div class="ie-desc">
                从 JSON 文件导入数据，将覆盖当前所有数据，请谨慎操作
              </div>
            </div>
            <button class="btn btn-danger" @click="handleImport">导入</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="section-title">用户角色列表</div>
        <div class="user-list">
          <div v-for="user in store.users" :key="user.id" class="user-card">
            <div class="user-avatar-lg">{{ user.name.charAt(0) }}</div>
            <div class="user-info">
              <div class="user-name-lg">{{ user.name }}</div>
              <div class="user-role-lg">
                <StatusBadge :status="user.role === 'admin' ? 'confirmed' : user.role" size="sm" />
                {{ user.roleLabel }}
              </div>
            </div>
            <div v-if="store.currentUser?.id === user.id" class="current-tag">
              当前登录
            </div>
          </div>
        </div>
        <div class="role-tip">
          💡 点击右上角头像可快速切换当前登录角色，用于测试不同角色的权限和流程
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  background: #fff;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  width: fit-content;
}

.tab-item {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-item.active {
  background: var(--primary-color);
  color: #fff;
  font-weight: 500;
}

.settings-content {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  padding: 24px;
}

.tab-content {
  min-height: 300px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.price-input {
  width: 120px;
}

.price-value {
  font-family: 'SF Mono', Monaco, monospace;
  font-weight: 600;
  color: var(--primary-color);
}

.price-reason-box {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.required {
  color: #ff4d4f;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.mono {
  font-family: 'SF Mono', Monaco, monospace;
}

.ie-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ie-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.ie-card.danger {
  background: #fff2f0;
  border-color: #ffccc7;
}

.ie-icon {
  font-size: 36px;
}

.ie-info {
  flex: 1;
}

.ie-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.ie-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  position: relative;
}

.user-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name-lg {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.user-role-lg {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 6px;
  border-radius: 4px;
}

.role-tip {
  margin-top: 20px;
  padding: 12px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  font-size: 13px;
  color: #0050b3;
}
</style>
