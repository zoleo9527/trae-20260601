<template>
  <div class="spare-parts">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <el-tag :type="getRoleTagType(userRole)">{{ getRoleText(userRole) }}</el-tag>
    </div>

    <div v-if="userRole === 'technician'" class="role-hint">
      <el-alert title="维修师提示" type="info" show-icon>
        您只能领用备件，如需管理备件库存请联系店长。
      </el-alert>
    </div>

    <div v-if="userRole === 'frontdesk'" class="role-hint">
      <el-alert title="前台提示" type="info" show-icon>
        您只能查看备件信息，如需领用或管理请联系维修师或店长。
      </el-alert>
    </div>

    <div class="toolbar">
      <template v-if="canManage">
        <el-button @click="showCreateDialog = true" type="primary">新建备件</el-button>
      </template>
      <template v-else>
        <el-button disabled title="当前角色无法管理备件">新建备件</el-button>
      </template>
      
      <div class="filters">
        <el-select v-model="filterCategory" placeholder="分类筛选">
          <el-option label="全部" value="" />
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button 
          @click="showLowStock = !showLowStock" 
          :type="showLowStock ? 'warning' : 'default'"
          :disabled="!canManage"
        >
          {{ showLowStock ? '显示全部' : '库存预警' }}
        </el-button>
        <el-input v-model="searchKeyword" placeholder="搜索备件名称或编号" style="width: 200px" />
      </div>
    </div>

    <el-table :data="filteredParts" border>
      <el-table-column prop="part_code" label="备件编号" />
      <el-table-column prop="part_name" label="备件名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="stock" label="库存">
        <template #default="scope">
          <span :class="{ 'low-stock': scope.row.stock <= scope.row.min_stock }">
            {{ scope.row.stock }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="min_stock" label="最低库存" />
      <el-table-column prop="unit_price" label="单价" />
      <el-table-column prop="supplier" label="供应商" />
      <el-table-column prop="location" label="存放位置" />
      <el-table-column label="操作">
        <template #default="scope">
          <template v-if="userRole === 'technician'">
            <el-button 
              @click="issuePart(scope.row)" 
              type="text" 
              :disabled="scope.row.stock <= 0"
              :title="scope.row.stock <= 0 ? '库存不足' : ''"
            >
              领用
            </el-button>
          </template>
          <template v-else-if="canManage">
            <el-button @click="editPart(scope.row)" type="text">编辑</el-button>
            <el-button @click="deletePart(scope.row.id)" type="text" danger>删除</el-button>
          </template>
          <template v-else>
            <span class="no-action">-</span>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="editingPart ? '编辑备件' : '新建备件'" v-model="showCreateDialog" width="500px">
      <el-form :model="partForm">
        <el-form-item label="备件编号" prop="part_code">
          <el-input v-model="partForm.part_code" :disabled="!!editingPart" />
        </el-form-item>
        <el-form-item label="备件名称" prop="part_name">
          <el-input v-model="partForm.part_name" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="partForm.category">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="partForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input type="number" v-model="partForm.unit_price" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="partForm.supplier" />
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="partForm.location" />
        </el-form-item>
        <el-form-item label="最低库存" prop="min_stock">
          <el-input-number v-model="partForm.min_stock" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="savePart">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="领用备件" v-model="showIssueDialog" width="400px">
      <el-form :model="issueForm" label-width="80px">
        <el-form-item label="备件名称">
          <el-input :value="selectedPart?.part_name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="selectedPart?.stock" disabled />
        </el-form-item>
        <el-form-item label="领用数量">
          <el-input-number v-model="issueForm.quantity" :min="1" :max="selectedPart?.stock || 1" />
        </el-form-item>
        <el-form-item label="领用工单">
          <el-select v-model="issueForm.order_id" placeholder="请选择工单">
            <el-option v-for="order in pendingOrders" :key="order.id" :label="order.order_no" :value="order.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showIssueDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmIssue">确定领用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { spareParts, repairs } from '../api'

const parts = ref([])
const categories = ref([])
const pendingOrders = ref([])
const filterCategory = ref('')
const searchKeyword = ref('')
const showLowStock = ref(false)
const showCreateDialog = ref(false)
const showIssueDialog = ref(false)
const editingPart = ref(null)
const selectedPart = ref(null)

const user = JSON.parse(localStorage.getItem('user') || '{}')
const userRole = computed(() => user.role || 'admin')
const canManage = computed(() => ['admin', 'manager'].includes(userRole.value))

const pageTitle = computed(() => {
  const titles = {
    admin: '备件管理',
    frontdesk: '备件查询',
    technician: '备件领用',
    manager: '备件管理'
  }
  return titles[userRole.value] || '备件管理'
})

const partForm = reactive({
  part_code: '',
  part_name: '',
  category: '',
  stock: 0,
  unit_price: 0,
  supplier: '',
  location: '',
  min_stock: 10
})

const issueForm = reactive({
  quantity: 1,
  order_id: '',
  issued_by: user.username
})

const filteredParts = computed(() => {
  return parts.value.filter(part => {
    const matchesCategory = !filterCategory.value || part.category === filterCategory.value
    const matchesSearch = !searchKeyword.value || 
      part.part_name.includes(searchKeyword.value) ||
      part.part_code.includes(searchKeyword.value)
    const matchesLowStock = !showLowStock.value || part.stock <= part.min_stock
    return matchesCategory && matchesSearch && matchesLowStock
  })
})

const getRoleTagType = (role) => {
  const types = {
    admin: 'info',
    frontdesk: 'primary',
    technician: 'success',
    manager: 'warning'
  }
  return types[role] || 'info'
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    frontdesk: '前台',
    technician: '维修师',
    manager: '店长'
  }
  return texts[role] || role
}

const loadParts = async () => {
  try {
    const res = await spareParts.getParts()
    parts.value = res.data
  } catch (error) {
    console.error('加载备件失败:', error)
  }
}

const loadCategories = async () => {
  try {
    const res = await spareParts.getCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadPendingOrders = async () => {
  try {
    const res = await repairs.getOrders({ status: 'pending' })
    pendingOrders.value = res.data
  } catch (error) {
    console.error('加载工单失败:', error)
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingPart.value = null
  partForm.part_code = ''
  partForm.part_name = ''
  partForm.category = ''
  partForm.stock = 0
  partForm.unit_price = 0
  partForm.supplier = ''
  partForm.location = ''
  partForm.min_stock = 10
}

const editPart = (part) => {
  editingPart.value = part
  partForm.part_code = part.part_code
  partForm.part_name = part.part_name
  partForm.category = part.category
  partForm.stock = part.stock
  partForm.unit_price = part.unit_price
  partForm.supplier = part.supplier
  partForm.location = part.location
  partForm.min_stock = part.min_stock
  showCreateDialog.value = true
}

const savePart = async () => {
  if (!partForm.part_code || !partForm.part_name) {
    ElMessage.warning('请填写备件编号和名称')
    return
  }
  
  try {
    if (editingPart.value) {
      await spareParts.updatePart(editingPart.value.id, partForm)
      ElMessage.success('备件已更新')
    } else {
      await spareParts.createPart(partForm)
      ElMessage.success('备件已创建')
    }
    
    closeDialog()
    loadParts()
    loadCategories()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deletePart = async (id) => {
  try {
    await spareParts.deletePart(id)
    ElMessage.success('备件已删除')
    loadParts()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const issuePart = (part) => {
  selectedPart.value = part
  issueForm.quantity = 1
  issueForm.order_id = ''
  showIssueDialog.value = true
}

const confirmIssue = async () => {
  if (!issueForm.order_id || issueForm.quantity <= 0) {
    ElMessage.warning('请选择工单并填写数量')
    return
  }
  
  try {
    await spareParts.issuePart(issueForm.order_id, {
      part_id: selectedPart.value.id,
      quantity: issueForm.quantity,
      issued_by: issueForm.issued_by
    })
    
    ElMessage.success('备件领用成功')
    showIssueDialog.value = false
    selectedPart.value = null
    issueForm.quantity = 1
    issueForm.order_id = ''
    loadParts()
    loadPendingOrders()
  } catch (error) {
    console.error('领用失败:', error)
    ElMessage.error('领用失败')
  }
}

onMounted(() => {
  loadParts()
  loadCategories()
  loadPendingOrders()
})
</script>

<style scoped>
.spare-parts {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.role-hint {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}

.no-action {
  color: #999;
}
</style>
