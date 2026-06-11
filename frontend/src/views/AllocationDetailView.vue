<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api, { type Allocation, type Verification, statusMap, reviewStatusMap, conclusionMap } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const detail = ref<Allocation | null>(null)

const currentUserId = 1
const currentUserRole = 'counter_manager'

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await api.getAllocation(Number(route.params.id))
    if (res.code === 0) detail.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (s?: string) => s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '-'

const canApproveFloor = computed(() => detail.value?.status === 'pending' || detail.value?.status === 'modified')
const canApproveBrand = computed(() => detail.value?.status === 'approved')

const approve = async (role: 'floor' | 'brand') => {
  const approverId = role === 'floor' ? 3 : 4
  const roleName = role === 'floor' ? '楼层主管' : '品牌督导'
  try {
    await ElMessageBox.confirm(`确认以【${roleName}】身份审批该调拨单？`, '审批确认', { type: 'warning' })
    const res = await api.approveAllocation(detail.value!.id, approverId)
    if (res.code === 0) {
      ElMessage.success('审批成功')
      loadDetail()
    }
  } catch (e) {}
}

const showModify = ref(false)
const modifyForm = ref({ quantity: 0, change_reason: '', version: 1 })

const openModify = () => {
  modifyForm.value = { quantity: detail.value!.quantity, change_reason: '', version: detail.value!.version }
  showModify.value = true
}

const submitModify = async () => {
  if (!modifyForm.value.change_reason) {
    ElMessage.warning('请填写修改原因')
    return
  }
  try {
    const res = await api.updateAllocation(detail.value!.id, modifyForm.value, currentUserId)
    if (res.code === 0) {
      ElMessage.success('修改成功，已通知复核端感知变更')
      showModify.value = false
      loadDetail()
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '修改失败')
  }
}

const fieldLabelMap: Record<string, string> = {
  quantity: '数量', from_counter: '调出柜', to_counter: '调入柜', goods_code: '商品编码',
  goods_name: '商品名称', sku: 'SKU', unit: '单位', remark: '备注', history_remark: '历史备注'
}

const canVerify = computed(() => detail.value?.status === 'disputed')

const showVerify = ref(false)
const verifyForm = ref({
  allocation_id: 0,
  conclusion: 'sender_short',
  responsibility: '',
  processing_remark: '',
})

const openVerify = () => {
  verifyForm.value = {
    allocation_id: detail.value!.id,
    conclusion: 'sender_short',
    responsibility: '',
    processing_remark: '',
  }
  showVerify.value = true
}

const submitVerify = async () => {
  if (!verifyForm.value.responsibility) {
    ElMessage.warning('请填写责任归属描述')
    return
  }
  try {
    const res = await api.createDisputeVerification(verifyForm.value, 4)
    if (res.code === 0) {
      ElMessage.success('差异核实完成')
      showVerify.value = false
      loadDetail()
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '核实失败')
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="page-header">
      <div class="page-title">
        📑 调拨单详情
        <el-tag v-if="detail?.is_modified" type="warning" style="margin-left: 10px">⚠️ 该调拨单已被修改过</el-tag>
      </div>
      <div>
        <el-button @click="loadDetail" :icon="Refresh">刷新</el-button>
        <el-button v-if="canApproveFloor" type="primary" @click="approve('floor')" :icon="Check">楼层主管审批</el-button>
        <el-button v-if="canApproveBrand" type="success" @click="approve('brand')" :icon="Van">品牌督导发货</el-button>
        <el-button v-if="detail?.status === 'shipped'" type="warning" @click="openModify" :icon="Edit">修改调拨内容</el-button>
        <el-button v-if="canVerify" type="danger" @click="openVerify">差异核实</el-button>
      </div>
    </div>

    <template v-if="detail">
      <el-descriptions :column="3" border style="margin-bottom: 16px" class="card-shadow">
        <el-descriptions-item label="调拨单号" :span="2">{{ detail.allocation_no }}</el-descriptions-item>
        <el-descriptions-item label="版本">v{{ detail.version }}</el-descriptions-item>
        <el-descriptions-item label="调出柜">{{ detail.from_counter }}</el-descriptions-item>
        <el-descriptions-item label="调入柜">{{ detail.to_counter }}</el-descriptions-item>
        <el-descriptions-item label="品牌/楼层">{{ detail.brand }} / {{ detail.floor }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ detail.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ detail.goods_code }}</el-descriptions-item>
        <el-descriptions-item label="SKU">{{ detail.sku || '-' }}</el-descriptions-item>
        <el-descriptions-item label="调拨数量">
          <span style="font-weight: 600; font-size: 18px; color: #4f46e5">{{ detail.quantity }} {{ detail.unit }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type || 'info'">{{ statusMap[detail.status]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(detail.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="最后修改人">{{ detail.updater_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后修改时间">{{ formatDate(detail.last_modified_at) }}</el-descriptions-item>
      </el-descriptions>

      <el-card class="card-shadow" style="margin-bottom: 16px">
        <template #header>
          <div style="font-weight: 600">📝 历史备注（完整时间线文字记录）</div>
        </template>
        <div class="history-remark">{{ detail.history_remark || '（无）' }}</div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-card class="card-shadow">
            <template #header>
              <div style="font-weight: 600">
                📜 变更日志（系统自动记录，不可篡改）
                <el-tag size="small" style="margin-left: 8px">{{ detail.change_logs.length }} 条</el-tag>
              </div>
            </template>
            <el-timeline v-if="detail.change_logs.length">
              <el-timeline-item
                v-for="log in detail.change_logs"
                :key="log.id"
                :timestamp="formatDate(log.operated_at)"
                type="warning"
              >
                <div class="change-log-item">
                  <div>
                    <b>{{ fieldLabelMap[log.field_name] || log.field_name }}</b>
                    ：
                    <span style="text-decoration: line-through; color: #9ca3af">{{ log.old_value }}</span>
                    →
                    <span style="color: #059669; font-weight: 500">{{ log.new_value }}</span>
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px">
                    操作人：{{ log.operator_name }} · 原因：{{ log.change_reason }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <div v-else style="color: #9ca3af; padding: 20px 0; text-align: center">暂无修改记录</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="card-shadow">
            <template #header>
              <div style="font-weight: 600">
                ✅ 到柜复核记录
                <el-tag v-if="detail.reviews.length" :type="reviewStatusMap[detail.reviews[0].review_status]?.type" size="small" style="margin-left: 8px">
                  {{ reviewStatusMap[detail.reviews[0].review_status]?.label }}
                </el-tag>
              </div>
            </template>
            <template v-if="detail.reviews.length">
              <div v-for="rev in detail.reviews" :key="rev.id" style="padding: 12px 0; border-bottom: 1px dashed #e5e7eb">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="复核单号" :span="2">{{ rev.review_no }}</el-descriptions-item>
                  <el-descriptions-item label="实收数量">{{ rev.actual_quantity }}</el-descriptions-item>
                  <el-descriptions-item label="差异说明" :span="2">{{ rev.difference_reason || '无差异' }}</el-descriptions-item>
                  <el-descriptions-item label="调拨单是否被修改">
                    <el-tag v-if="rev.has_allocation_modified" type="warning">是</el-tag>
                    <span v-else>否</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="复核人确认变更">
                    <el-tag v-if="rev.modification_acknowledged" type="success">✓ 已确认</el-tag>
                    <el-tag v-else type="danger">✗ 未确认</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="复核人">{{ rev.reviewer_name }}</el-descriptions-item>
                  <el-descriptions-item label="复核时间">{{ formatDate(rev.reviewed_at) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
            <div v-else style="color: #9ca3af; padding: 20px 0; text-align: center">
              {{ detail.status === 'shipped' ? '已发货，待调入柜复核' : '尚未进入到柜复核阶段' }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card v-if="detail.verifications && detail.verifications.length" class="card-shadow" style="margin-top: 16px">
        <template #header>
          <div style="font-weight: 600">
            🔍 差异核实记录
            <el-tag
              v-for="vf in detail.verifications" :key="vf.id"
              :type="conclusionMap[vf.conclusion]?.type || 'info'"
              size="small"
              style="margin-left: 8px"
            >
              {{ conclusionMap[vf.conclusion]?.label || vf.conclusion }}
            </el-tag>
          </div>
        </template>
        <div v-for="vf in detail.verifications" :key="vf.id" style="padding: 12px 0; border-bottom: 1px dashed #e5e7eb">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="核实单号" :span="2">{{ vf.verification_no }}</el-descriptions-item>
            <el-descriptions-item label="核实结论">
              <el-tag :type="conclusionMap[vf.conclusion]?.type || 'info'" effect="dark">
                {{ conclusionMap[vf.conclusion]?.label || vf.conclusion }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="核实人">{{ vf.verifier_name }}</el-descriptions-item>
            <el-descriptions-item label="责任归属" :span="2">
              <div style="color: #991b1b; font-weight: 500">{{ vf.responsibility }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="处理备注" :span="2">{{ vf.processing_remark || '无' }}</el-descriptions-item>
            <el-descriptions-item label="核实时间" :span="2">{{ formatDate(vf.verified_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <el-card v-else-if="detail.status === 'disputed'" class="card-shadow" style="margin-top: 16px">
        <template #header>
          <div style="font-weight: 600; color: #991b1b">⚠️ 差异待核实</div>
        </template>
        <div style="text-align: center; padding: 20px; color: #6b7280">
          <div style="margin-bottom: 12px">该调拨单存在数量差异，待品牌督导核实</div>
          <el-button type="danger" @click="openVerify">执行差异核实</el-button>
        </div>
      </el-card>
    </template>

    <el-dialog v-model="showVerify" title="差异核实（品牌督导）" width="560px" :close-on-click-modal="false">
      <el-alert type="error" show-icon :closable="false" style="margin-bottom: 16px" title="该调拨单到柜复核时存在数量差异，请核实后填写结论" />
      <el-descriptions v-if="detail" :column="2" size="small" border style="margin-bottom: 16px">
        <el-descriptions-item label="调拨单号">{{ detail.allocation_no }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ detail.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="期望数量">{{ detail.quantity }}{{ detail.unit }}</el-descriptions-item>
        <el-descriptions-item label="实收数量">
          <span style="color: #ef4444; font-weight: 600">{{ detail.reviews[0]?.actual_quantity ?? '-' }}{{ detail.unit }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="差异说明" :span="2">{{ detail.reviews[0]?.difference_reason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="verifyForm" label-width="110px">
        <el-form-item label="核实结论" required>
          <el-radio-group v-model="verifyForm.conclusion">
            <el-radio value="sender_short">
              <span style="color: #991b1b">发货方少装</span>
              <span style="font-size: 12px; color: #9ca3af; margin-left: 4px">（责任在调出方）</span>
            </el-radio>
            <el-radio value="receiver_false">
              <span style="color: #92400e">收货方误报</span>
              <span style="font-size: 12px; color: #9ca3af; margin-left: 4px">（责任在调入方）</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="责任归属描述" required>
          <el-input v-model="verifyForm.responsibility" type="textarea" :rows="3" placeholder="请详细说明核实过程和责任认定依据（如：核查出库记录确认少装/监控确认已装箱等），将作为责任认定终审依据" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="verifyForm.processing_remark" type="textarea" :rows="2" placeholder="补发安排、内部整改措施等（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerify = false">取消</el-button>
        <el-button type="danger" @click="submitVerify">确认提交核实</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showModify" title="修改调拨内容（修改后复核端会自动感知）" width="500px">
      <el-form :model="modifyForm" label-width="100px">
        <el-form-item label="调拨数量">
          <el-input-number v-model="modifyForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="修改原因" required>
          <el-input v-model="modifyForm.change_reason" type="textarea" :rows="3" placeholder="请详细说明修改原因，将永久记录在变更日志中" />
        </el-form-item>
        <el-form-item>
          <div style="font-size: 12px; color: #92400e; background: #fffbeb; padding: 8px; border-radius: 4px">
            ⚠️ 修改后，到柜复核端将看到「该调拨单被修改」提示，复核人必须确认知晓变更后才能完成复核
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModify = false">取消</el-button>
        <el-button type="primary" @click="submitModify">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>
