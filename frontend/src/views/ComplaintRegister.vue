<template>
  <div class="card" style="max-width: 800px; margin: 0 auto;">
    <div class="card-title">✏️ 投诉登记</div>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">投诉类型</label>
        <select v-model="form.type" class="form-select">
          <option value="">请选择</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">涉及区域</label>
        <select v-model="form.orchardArea" class="form-select">
          <option value="">请选择</option>
          <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">投诉标题</label>
      <input v-model="form.title" class="form-input" placeholder="一句话概括投诉内容" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">游客姓名</label>
        <input v-model="form.visitorName" class="form-input" placeholder="请输入游客姓名" />
      </div>
      <div class="form-group">
        <label class="form-label required">联系电话</label>
        <input v-model="form.visitorPhone" class="form-input" placeholder="请输入联系电话" />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">投诉描述</label>
      <textarea v-model="form.description" class="form-textarea" placeholder="请详细描述投诉内容"></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">登记备注</label>
      <textarea v-model="form.registerRemark" class="form-textarea" placeholder="登记时的补充说明，会同步给后续处理人"></textarea>
      <div style="font-size:12px; color:#909399; margin-top:4px;">
        ⚠️ 备注会在后续核实、补偿发放等环节持续显示，方便各角色衔接
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">指派核实人</label>
      <select v-model="form.assignedTo" class="form-select">
        <option value="">请选择</option>
        <option v-for="u in guides" :key="u.id" :value="u.id">{{ u.name }}（采摘向导）</option>
      </select>
    </div>

    <div style="margin-top:24px; display:flex; gap:12px; justify-content:flex-end;">
      <button class="btn btn-default" @click="$router.back()">取消</button>
      <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交登记' }}
      </button>
    </div>

    <div style="margin-top:20px; padding:16px; background:#fffbe6; border-radius:6px;">
      <div style="font-weight:500; margin-bottom:8px; color:#d48806;">📌 责任说明</div>
      <ul style="margin-left:20px; color:#606266; font-size:13px; line-height:1.8;">
        <li><b>园区客服</b>：负责投诉登记、指派核实人、最终结案回访</li>
        <li><b>采摘向导</b>：负责现场核实情况、判断是否需要补偿、提出补偿方案</li>
        <li><b>仓库员</b>：负责补偿物资准备、登记发放、可退回并注明原因</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createComplaint, getComplaintTypes } from '../api/complaint'
import { getUsers } from '../api/user'

const router = useRouter()
const submitting = ref(false)
const types = ref([])
const guides = ref([])
const areas = ref(['A区桃园', 'B区梨园', 'C区苹果园', 'D区葡萄园', '休息区', '售票处', '其他'])

const form = ref({
  type: '',
  title: '',
  visitorName: '',
  visitorPhone: '',
  orchardArea: '',
  description: '',
  registerRemark: '',
  assignedTo: ''
})

async function loadMeta() {
  try {
    const [typesRes, usersRes] = await Promise.all([
      getComplaintTypes(),
      getUsers({ role: 'PICKING_GUIDE' })
    ])
    if (typesRes.code === 0) types.value = typesRes.data
    if (usersRes.code === 0) guides.value = usersRes.data
  } catch (e) {
    types.value = ['服务态度', '采摘体验', '果品质量', '环境卫生', '收费问题', '安全问题', '其他']
    guides.value = [{ id: 'u2', name: '王向导' }, { id: 'u3', name: '张向导' }]
  }
}

function validate() {
  if (!form.value.type) { alert('请选择投诉类型'); return false }
  if (!form.value.orchardArea) { alert('请选择涉及区域'); return false }
  if (!form.value.title.trim()) { alert('请填写投诉标题'); return false }
  if (!form.value.visitorName.trim()) { alert('请填写游客姓名'); return false }
  if (!form.value.visitorPhone.trim()) { alert('请填写联系电话'); return false }
  if (!form.value.description.trim()) { alert('请填写投诉描述'); return false }
  if (!form.value.assignedTo) { alert('请指派核实人'); return false }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  
  submitting.value = true
  try {
    const res = await createComplaint({
      ...form.value,
      registerBy: localStorage.getItem('currentUserId') || 'u1'
    })
    if (res.code === 0) {
      alert('登记成功')
      router.push(`/complaint/${res.data.id}`)
    }
  } catch (e) {
    console.error('提交失败', e)
    alert('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMeta()
})
</script>
