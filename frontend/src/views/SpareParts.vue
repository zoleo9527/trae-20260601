<template>
  <div class="spare-parts">
    <div class="toolbar">
      <el-button @click="showCreateDialog = true" type="primary">新建备件</el-button>
      <div class="filters">
        <el-select v-model="filterCategory" placeholder="分类筛选">
          <el-option label="全部" value="" />
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button @click="showLowStock = !showLowStock" :type="showLowStock ? 'warning' : 'default'">
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
          <el-button @click="editPart(scope.row)" type="text">编辑</el-button>
          <el-button @click="deletePart(scope.row.id)" type="text" danger>删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="editingPart ? '编辑备件' : '新建备件'" v-model="showCreateDialog" width="500px">
      <el-form :model="partForm" ref="partForm">
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
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { spareParts } from '../api'

const parts = ref([])
const categories = ref([])
const filterCategory = ref('')
const searchKeyword = ref('')
const showLowStock = ref(false)
const showCreateDialog = ref(false)
const editingPart = ref(null)

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

const loadParts = async () => {
  const res = await spareParts.getParts()
  parts.value = res.data
}

const loadCategories = async () => {
  const res = await spareParts.getCategories()
  categories.value = res.data
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
    alert('请填写备件编号和名称')
    return
  }
  
  if (editingPart.value) {
    await spareParts.updatePart(editingPart.value.id, partForm)
  } else {
    await spareParts.createPart(partForm)
  }
  
  closeDialog()
  loadParts()
  loadCategories()
}

const deletePart = async (id) => {
  if (confirm('确定删除该备件吗？')) {
    await spareParts.deletePart(id)
    loadParts()
  }
}

onMounted(() => {
  loadParts()
  loadCategories()
})
</script>

<style scoped>
.spare-parts {
  padding: 20px;
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
</style>
