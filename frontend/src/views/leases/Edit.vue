<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
        <span style="margin-left:10px;">{{ isEdit ? '编辑租约' : '新建品牌租约' }}</span>
      </div>
    </div>

    <el-card style="max-width:1000px;margin:0 auto;">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-divider content-position="left">品牌 & 铺位信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand_id">
              <el-select v-model="form.brand_id" placeholder="选择品牌" style="width:100%" @change="onBrandChange">
                <el-option v-for="b in brands" :key="b.id" :label="b.brand_name" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌名称" prop="brand_name">
              <el-input v-model="form.brand_name" placeholder="自动填充或手输" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="铺位编号">
              <el-input v-model="form.store_code" placeholder="如 A-101" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-select v-model="form.floor" style="width:100%">
                <el-option label="1F" value="1F" /><el-option label="2F" value="2F" />
                <el-option label="B1" value="B1" /><el-option label="B2" value="B2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面积(㎡)">
              <el-input-number v-model="form.area" :min="0" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">租约条款</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起租日期" prop="start_date">
              <el-date-picker v-model="form.start_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期" prop="end_date">
              <el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基础租金(元/月)">
              <el-input-number v-model="form.base_rent" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缴费方式">
              <el-select v-model="form.payment_method" style="width:100%">
                <el-option label="月付" value="月付" /><el-option label="季付" value="季付" /><el-option label="年付" value="年付" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="合同内容摘要">
          <el-input v-model="form.contract_content" type="textarea" :rows="4" placeholder="填写合同核心条款，如装修免租期、租金递增方式等" />
        </el-form-item>

        <el-form-item label="是否有特殊条款">
          <el-switch v-model="form.has_special_clause" :active-value="1" :inactive-value="0" active-text="是(扣点规则需包含)" />
          <el-tooltip v-if="form.has_special_clause" content="合同约定有特殊条款的，提交后营运督导会重点检查扣点规则的特殊条款字段是否填写。">
            <el-icon style="margin-left:8px;color:#f59e0b;"><WarningFilled /></el-icon>
          </el-tooltip>
        </el-form-item>

        <el-divider />
        <el-form-item>
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="save(false)">💾 保存草稿</el-button>
          <el-button v-if="!isEdit || form.status === 'REJECTED'" type="success" @click="save(true)">🚀 直接提交审核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, WarningFilled } from '@element-plus/icons-vue'
import { getBrands, createLease, updateLease, getLeaseDetail, submitLease } from '@/api'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const brands = ref([])
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  brand_id: null, brand_name: '', store_code: '', floor: '', area: null,
  start_date: '', end_date: '', base_rent: null, payment_method: '月付',
  contract_content: '', has_special_clause: 0,
})

const rules = {
  brand_id: [{ required: true, message: '请选择品牌' }],
  brand_name: [{ required: true, message: '请填写品牌名称' }],
  start_date: [{ required: true, message: '请选择起租日期' }],
  end_date: [{ required: true, message: '请选择到期日期' }],
}

const onBrandChange = (id) => {
  const b = brands.value.find(x => x.id === id)
  if (b) form.brand_name = b.brand_name
}

const loadDetail = async () => {
  const res = await getLeaseDetail(route.params.id)
  Object.assign(form, res.data)
}

const save = async (andSubmit) => {
  await formRef.value.validate()
  if (!isEdit.value) {
    const res = await createLease(form)
    ElMessage.success(andSubmit ? '已提交审核' : '草稿已保存')
    const id = res.data.id
    if (andSubmit) await submitLease(id)
    router.replace(`/leases/${id}`)
  } else {
    await updateLease(route.params.id, form)
    ElMessage.success(andSubmit ? '已提交审核' : '修改已保存')
    if (andSubmit) await submitLease(route.params.id)
    router.replace(`/leases/${route.params.id}`)
  }
}

onMounted(async () => {
  brands.value = (await getBrands()).data
  if (isEdit.value) loadDetail()
})
</script>
