<template>
  <div class="flow-guide" style="background: #fff; border-bottom: 1px solid #e4e7ed; padding: 10px 24px; flex-shrink: 0;">
    <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <el-icon :size="18" color="#667eea"><DataLine /></el-icon>
        <span style="font-size: 13px; font-weight: 600; color: #303133;">流程说明：</span>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div
          v-for="flow in flowTypes"
          :key="flow.value"
          class="flow-item card-hover"
          :class="{ active: activeFlow === flow.value }"
          style="display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 16px; cursor: pointer; transition: all 0.2s; background: #f5f7fa; border: 1px solid #e4e7ed;"
          @click="toggleFlow(flow.value)"
        >
          <el-icon :size="14" :color="flow.color">
            <component :is="flow.icon" />
          </el-icon>
          <span style="font-size: 12px;">{{ flow.label }}</span>
          <el-tag size="small" :type="flow.tagType" effect="plain">{{ flow.count }}单</el-tag>
        </div>
      </div>
      <div style="flex: 1;"></div>
      <el-button size="small" type="primary" plain @click="showGuide = true">
        <el-icon><QuestionFilled /></el-icon>查看完整流程
      </el-button>
    </div>

    <div v-if="activeFlow" class="flow-detail" style="margin-top: 10px; padding: 12px 16px; border-radius: 8px; display: flex; align-items: flex-start; gap: 16px;" :style="{ background: activeFlowConfig.bg, borderLeft: `4px solid ${activeFlowConfig.color}` }">
      <el-icon :size="24" :color="activeFlowConfig.color" style="margin-top: 2px; flex-shrink: 0;">
        <component :is="activeFlowConfig.icon" />
      </el-icon>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">{{ activeFlowConfig.title }}</div>
        <div style="font-size: 12px; color: #606266; line-height: 1.6;">{{ activeFlowConfig.description }}</div>
        <div style="margin-top: 8px;">
          <el-tag size="small" v-for="tag in activeFlowConfig.tags" :key="tag" style="margin-right: 6px;">
            {{ tag }}
          </el-tag>
        </div>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        <div style="font-size: 11px; color: #909399; margin-bottom: 4px;">样例订单</div>
        <el-button size="small" text @click="navigateToSample">
          {{ activeFlowConfig.sampleId }}
          <el-icon style="margin-left: 2px;"><TopRight /></el-icon>
        </el-button>
      </div>
    </div>

    <el-dialog v-model="showGuide" title="退款协商 → 疗程核销 完整流程图" width="900px">
      <div style="padding: 20px;">
        <el-steps :active="-1" finish-status="success">
          <el-step title="客户付费" icon="Money" description="创建订单" />
          <el-step title="待核销" icon="Clock" description="等待治疗" />
          <el-step title="客户申请退款" icon="Warning" description="提出退款诉求" />
          <el-step title="退款协商中" icon="ChatLineRound" description="双方沟通方案" />
          <el-step title="待补录材料" icon="Upload" description="材料不全，补充后重审" />
          <el-step title="退款同意" icon="CircleCheck" description="协商一致，移交财务" />
          <el-step title="退款驳回" icon="CircleClose" description="转回疗程继续治疗" />
          <el-step title="疗程核销中" icon="Select" description="医助执行核销" />
          <el-step title="已归档" icon="FolderChecked" description="完成，永久存档" />
        </el-steps>

        <el-divider content-position="left">关键设计要点</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <div style="padding: 16px; background: #ecf5ff; border-radius: 8px; height: 100%;">
              <el-icon :size="24" color="#409eff"><View /></el-icon>
              <div style="font-weight: 600; margin: 8px 0 4px;">状态口径一致</div>
              <div style="font-size: 12px; color: #606266; line-height: 1.6;">
                7种状态统一定义，无论咨询师、医助、客服看到的状态标签和含义完全一致，避免各说各话。
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div style="padding: 16px; background: #f0f9eb; border-radius: 8px; height: 100%;">
              <el-icon :size="24" color="#67c23a"><SwitchButton /></el-icon>
              <div style="font-weight: 600; margin: 8px 0 4px;">责任人不脱节</div>
              <div style="font-size: 12px; color: #606266; line-height: 1.6;">
                每次状态变更或移交必须明确责任人，移交来源和原因可追溯，杜绝"没人管"的空档期。
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div style="padding: 16px; background: #fdf6ec; border-radius: 8px; height: 100%;">
              <el-icon :size="24" color="#e6a23c"><DocumentChecked /></el-icon>
              <div style="font-weight: 600; margin: 8px 0 4px;">历史永久留存</div>
              <div style="font-size: 12px; color: #606266; line-height: 1.6;">
                所有操作、说明、驳回理由、补录要求全部记录在历史中，不用再翻聊天记录和纸质文件。
              </div>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left">三条样例路径</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="✅ 顺利流（张女士 热玛吉）">
            客户怀孕特殊情况 → 协商一致店长特批全额退款 → 客服跟进财务 → 完成。<br/>
            <el-tag size="small" type="success">关键点：特殊情况有审批记录，移交有原因说明</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="⚠️ 问题流（刘先生 玻尿酸）">
            客户称"没效果"要求全额退款 → 材料不全要求补录 → 材料仍不标准 → 三方沟通+医疗评估 → 驳回退款转回疗程 → 医助跟进核销。<br/>
            <el-tag size="small" type="warning">关键点：补录要求明确，驳回理由充分，转回时责任人和历史说明完整传递</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="📁 归档流（陈女士 皮秒）">
            3次疗程全部核销 → 客户满意 → 自动归档 → 所有资料永久保存。<br/>
            <el-tag size="small" type="info">关键点：正常流程也有完整记录，可回看可追溯</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, actions } from '../data/store.js'
import { FLOW_TYPES } from '../data/constants.js'

const activeFlow = ref(null)
const showGuide = ref(false)

const flowTypes = [
  { value: FLOW_TYPES.SMOOTH, label: '顺利流', icon: 'CircleCheck', color: '#67c23a', tagType: 'success' },
  { value: FLOW_TYPES.PROBLEM, label: '问题流', icon: 'Warning', color: '#e6a23c', tagType: 'warning' },
  { value: FLOW_TYPES.ARCHIVED, label: '归档流', icon: 'FolderChecked', color: '#909399', tagType: 'info' }
]

const flowCounts = computed(() => ({
  [FLOW_TYPES.SMOOTH]: store.orders.filter(o => o.flowType === FLOW_TYPES.SMOOTH).length,
  [FLOW_TYPES.PROBLEM]: store.orders.filter(o => o.flowType === FLOW_TYPES.PROBLEM).length,
  [FLOW_TYPES.ARCHIVED]: store.orders.filter(o => o.flowType === FLOW_TYPES.ARCHIVED).length
}))

const flowTypesWithCount = computed(() => flowTypes.map(f => ({
  ...f,
  count: flowCounts.value[f.value]
})))

const activeFlowConfig = computed(() => {
  const configs = {
    [FLOW_TYPES.SMOOTH]: {
      color: '#67c23a',
      bg: '#f0f9eb',
      icon: 'CircleCheck',
      title: '顺利流：退款协商一致 → 财务退款',
      description: '客户有合理退款理由（如怀孕），双方经协商达成一致。店长特批全额退款后，责任人从咨询师移交到客服跟进财务流程。整个过程每一步都有记录，无扯皮空间。',
      tags: ['材料齐全', '协商一致', '特批有记录', '责任人移交明确'],
      sampleId: 'ORD-20260528-001'
    },
    [FLOW_TYPES.PROBLEM]: {
      color: '#e6a23c',
      bg: '#fdf6ec',
      icon: 'Warning',
      title: '问题流：材料不全 → 补录 → 驳回 → 转回疗程',
      description: '客户退款理由不充分或材料不全时，系统强制要求补录并明确补录内容和时限。驳回时必须写明理由，转回疗程核销时责任人和历史说明完整传递，医助能看到之前的所有协商过程。',
      tags: ['补录要求明确', '驳回理由充分', '历史说明不丢失', '责任人无缝衔接'],
      sampleId: 'ORD-20260525-002'
    },
    [FLOW_TYPES.ARCHIVED]: {
      color: '#909399',
      bg: '#f4f4f5',
      icon: 'FolderChecked',
      title: '归档流：疗程全部完成 → 自动归档',
      description: '无论是否经过退款协商，只要所有疗程核销完成或退款完成，订单自动归档。所有历史记录、咨询记录、报价单、术后回访永久保存，可随时回看。',
      tags: ['自动归档', '资料永久保存', '可回看可追溯', '无空档期'],
      sampleId: 'ORD-20260501-003'
    }
  }
  return configs[activeFlow.value] || null
})

const toggleFlow = (val) => {
  activeFlow.value = activeFlow.value === val ? null : val
}

const navigateToSample = () => {
  if (activeFlowConfig.value?.sampleId) {
    actions.selectOrder(activeFlowConfig.value.sampleId)
    activeFlow.value = null
  }
}
</script>
