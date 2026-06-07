<template>
  <div class="page-container">
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="24">
        <el-card shadow="never" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 20px; font-weight: 500; margin-bottom: 8px">
                {{ greetingText }}，{{ userStore.roleName }}
              </div>
              <div style="font-size: 14px; opacity: 0.85">
                {{ roleTipText }}
              </div>
            </div>
            <div style="display: flex; gap: 12px">
              <el-button
                v-for="action in quickActions"
                :key="action.key"
                :type="action.type"
                size="large"
                @click="handleQuickAction(action)"
              >
                <el-icon style="margin-right: 6px"><component :is="action.icon" /></el-icon>
                {{ action.label }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" v-for="(row, rowIndex) in cardRows" :key="rowIndex" style="margin-bottom: 16px">
      <el-col :span="col.span" v-for="col in row" :key="col.key">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div style="display: flex; align-items: center; gap: 10px">
                <span style="font-weight: 500">{{ col.title }}</span>
                <el-tag v-if="col.count !== undefined" :type="col.tagType" size="small">
                  {{ col.count }}
                </el-tag>
              </div>
              <el-button v-if="col.moreLink" type="primary" link @click="$router.push(col.moreLink)">
                查看全部
              </el-button>
            </div>
          </template>

          <div v-if="col.type === 'stat'">
            <div style="display: flex; align-items: center; justify-content: space-between">
              <div>
                <div style="font-size: 14px; color: #909399">{{ col.subtitle }}</div>
                <div :style="{ fontSize: '32px', fontWeight: 'bold', color: col.color, marginTop: '8px' }">
                  {{ col.value }}
                </div>
              </div>
              <div :style="{ width: '60px', height: '60px', background: col.bgColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                <el-icon :style="{ fontSize: '28px', color: col.color }"><component :is="col.icon" /></el-icon>
              </div>
            </div>
          </div>

          <div v-else-if="col.type === 'list' && col.data?.length > 0">
            <el-table :data="col.data" size="small" style="width: 100%">
              <el-table-column v-for="c in col.columns" :key="c.prop" v-bind="c">
                <template v-if="c.slot" #default="{ row }">
                  <component :is="c.slot" :row="row" :col="c" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="col.type === 'list'">
            <el-empty :description="col.emptyText" :image-size="60">
              <template #footer>
                <el-button size="small" type="primary" @click="handleQuickAction(col.emptyAction)">
                  {{ col.emptyAction?.label || '去处理' }}
                </el-button>
              </template>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { getDashboard } from '@/api/dashboard'
import {
  Goods, Present, Warning, RefreshLeft, Plus, Check, CircleClose, Bell, DocumentAdd, Edit
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const dashboard = ref({})

const loadData = async () => {
  dashboard.value = await getDashboard()
}

const greetingText = computed(() => {
  const hour = dayjs().hour()
  if (hour < 10) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const pendingAuditList = computed(() => {
  const list = dashboard.value.pendingVerificationList || []
  return list.filter(item => item.status === 'PENDING')
})

const pendingOutboundList = computed(() => {
  const list = dashboard.value.pendingVerificationList || []
  return list.filter(item => item.status === 'COMPLETED' && item.outboundStatus === 'PENDING' && item.outboundId)
})

const roleTipText = computed(() => {
  if (userStore.isBooking) {
    const count = pendingAuditList.value.length
    return count > 0 ? `您有 ${count} 条核销单等待楼面经理审核，可继续发起新的核销` : '今日暂无待审核核销单，可随时发起核销'
  }
  if (userStore.isFloor) {
    const count = pendingAuditList.value.length
    const timeout = dashboard.value.timeoutCount || 0
    return count > 0 ? `您有 ${count} 条核销单待审核${timeout > 0 ? `，${timeout} 条超时未处理` : ''}` : '今日暂无待审核核销，注意处理超时和退回记录'
  }
  if (userStore.isBar) {
    const count = (dashboard.value.pendingOutboundList || []).length + pendingOutboundList.value.length
    return count > 0 ? `您有 ${count} 条出库单待处理，请及时完成出库` : '今日暂无待处理出库，保持关注新单'
  }
  return '全局概览，可查看所有岗位的待处理事项'
})

const quickActions = computed(() => {
  if (userStore.isBooking) {
    return [
      { key: 'create-verification', label: '发起核销', type: 'primary', icon: DocumentAdd, path: '/verification/create' }
    ]
  }
  if (userStore.isFloor) {
    return [
      { key: 'audit-verification', label: '处理审核', type: 'primary', icon: Check, path: '/verification' },
      { key: 'view-rejected', label: '查看退回', type: 'info', icon: CircleClose, path: '/verification?status=REJECTED' }
    ]
  }
  if (userStore.isBar) {
    return [
      { key: 'handle-outbound', label: '处理出库', type: 'warning', icon: Goods, path: '/outbound' },
      { key: 'create-outbound', label: '新建出库', type: 'primary', icon: Plus, path: '/outbound/create' }
    ]
  }
  return [
    { key: 'verification', label: '核销管理', type: 'primary', icon: Present, path: '/verification' },
    { key: 'outbound', label: '出库管理', type: 'warning', icon: Goods, path: '/outbound' }
  ]
})

const VerificationNoCell = (props) => h('span', {
  style: { color: '#409eff', cursor: 'pointer' },
  onClick: () => router.push(`/verification/${props.row.id}`)
}, props.row.verificationNo || props.row.no)

const OutboundNoCell = (props) => h('span', {
  style: { color: '#409eff', cursor: 'pointer' },
  onClick: () => router.push(`/outbound/${props.row.id || props.row.outboundId}`)
}, props.row.outboundNo || props.row.no)

const ActionCell = (props) => {
  const actions = props.col.actions || []
  const action = actions.find(a => a.when ? a.when(props.row) : true)
  if (!action) return null
  return h(
    'el-button',
    { type: action.type, size: 'small', link: true, onClick: () => handleQuickAction(action, props.row) },
    () => [action.icon && h('el-icon', {}, () => h(action.icon)), action.label]
  )
}

const TypeTagCell = (props) => h('el-tag', {
  type: props.row.type === 'OUTBOUND' ? 'warning' : 'primary', size: 'small'
}, () => props.row.type === 'OUTBOUND' ? '出库' : '核销')

const StatusTagCell = (props) => {
  const map = { PENDING: 'warning', COMPLETED: 'success', REJECTED: 'danger' }
  const labelMap = { PENDING: '待处理', COMPLETED: '已完成', REJECTED: '已退回' }
  return h('el-tag', { type: map[props.row.status] || 'info', size: 'small' }, () => labelMap[props.row.status] || props.row.status)
}

const AmountCell = (props) => h('span', {}, `¥${props.row.usedAmount || props.row.totalAmount || props.row.amount || 0}`)

const TimeCell = (props) => h('span', {
  style: props.col.timeColor ? { color: props.col.timeColor } : {}
}, dayjs(props.row.createTime || props.row.handleTime).format('MM-DD HH:mm'))

const cardRows = computed(() => {
  const baseCards = {
    pendingOutbound: {
      key: 'pending-outbound', title: '今日待处理出库', type: 'list',
      tagType: 'warning', count: dashboard.value.pendingOutboundCount || 0,
      moreLink: '/outbound',
      data: dashboard.value.pendingOutboundList || [],
      columns: [
        { prop: 'outboundNo', label: '出库单号', width: 140, slot: OutboundNoCell },
        { prop: 'roomNo', label: '包厢', width: 80 },
        { prop: 'totalAmount', label: '金额', width: 100, slot: AmountCell },
        { prop: 'outboundType', label: '类型', width: 80, slot: (props) => h('el-tag', {
          type: props.row.outboundType === 'SALE' ? 'success' : 'warning', size: 'small'
        }, () => props.row.outboundType === 'SALE' ? '销售' : '赠送') },
        { prop: 'createTime', label: '创建时间', width: 140, slot: TimeCell },
        { prop: 'action', label: '操作', width: 100, slot: ActionCell, actions: [
          { label: '处理', type: 'primary', icon: Goods, path: '/outbound', useId: true }
        ]}
      ],
      emptyText: '暂无待处理出库单',
      emptyAction: { label: '新建出库', path: '/outbound/create' }
    },

    pendingAudit: {
      key: 'pending-audit', title: '待审核核销单', type: 'list',
      tagType: 'primary', count: pendingAuditList.value.length,
      moreLink: '/verification',
      data: pendingAuditList.value,
      columns: [
        { prop: 'verificationNo', label: '核销单号', width: 140, slot: VerificationNoCell },
        { prop: 'roomNo', label: '包厢', width: 80 },
        { prop: 'customerName', label: '客户', width: 80 },
        { prop: 'usedAmount', label: '金额', width: 100, slot: AmountCell },
        { prop: 'createTime', label: '创建时间', width: 140, slot: TimeCell },
        { prop: 'action', label: '操作', width: 100, slot: ActionCell, actions: [
          { label: '审核', type: 'primary', icon: Check, path: '/verification', useId: true }
        ]}
      ],
      emptyText: '暂无待审核核销单',
      emptyAction: userStore.isBooking
        ? { label: '发起核销', path: '/verification/create' }
        : { label: '查看全部', path: '/verification' }
    },

    pendingGiftOutbound: {
      key: 'pending-gift-outbound', title: '核销已通过，待出库', type: 'list',
      tagType: 'warning', count: pendingOutboundList.value.length,
      moreLink: '/outbound',
      data: pendingOutboundList.value,
      columns: [
        { prop: 'verificationNo', label: '核销单号', width: 140, slot: VerificationNoCell },
        { prop: 'roomNo', label: '包厢', width: 80 },
        { prop: 'usedAmount', label: '金额', width: 100, slot: AmountCell },
        { prop: 'outboundNo', label: '出库单号', width: 140, slot: OutboundNoCell },
        { prop: 'action', label: '操作', width: 100, slot: ActionCell, actions: [
          { label: '去出库', type: 'warning', icon: Bell, path: '/outbound', useOutboundId: true }
        ]}
      ],
      emptyText: '暂无待出库的核销单',
      emptyAction: { label: '去出库列表', path: '/outbound' }
    },

    timeout: {
      key: 'timeout', title: '超时未处理（超过2小时）', type: 'list',
      tagType: 'danger', count: dashboard.value.timeoutCount || 0,
      data: dashboard.value.timeoutList || [],
      columns: [
        { prop: 'type', label: '类型', width: 80, slot: TypeTagCell },
        { prop: 'no', label: '单号', width: 150, slot: (props) => h('span', {
          style: { color: '#409eff', cursor: 'pointer' },
          onClick: () => {
            if (props.row.type === 'OUTBOUND') router.push(`/outbound/${props.row.id}`)
            else router.push(`/verification/${props.row.id}`)
          }
        }, props.row.no) },
        { prop: 'roomNo', label: '包厢', width: 80 },
        { prop: 'amount', label: '金额', width: 100, slot: AmountCell },
        { prop: 'createTime', label: '超时时间', width: 140, slot: TimeCell, timeColor: '#f56c6c' },
        { prop: 'action', label: '操作', width: 100, slot: ActionCell, actions: [
          { label: '去处理', type: 'primary', useType: true }
        ]}
      ],
      emptyText: '暂无超时记录',
      emptyAction: { label: '去审核', path: '/verification' }
    },

    rejected: {
      key: 'rejected', title: '24小时内刚退回', type: 'list',
      tagType: 'info', count: dashboard.value.rejectedCount || 0,
      data: dashboard.value.rejectedList || [],
      columns: [
        { prop: 'type', label: '类型', width: 80, slot: TypeTagCell },
        { prop: 'no', label: '单号', width: 150, slot: (props) => h('span', {
          style: { color: '#409eff', cursor: 'pointer' },
          onClick: () => {
            if (props.row.type === 'OUTBOUND') router.push(`/outbound/${props.row.id}`)
            else router.push(`/verification/${props.row.id}`)
          }
        }, props.row.no) },
        { prop: 'roomNo', label: '包厢', width: 80 },
        { prop: 'rejectReason', label: '退回原因', showOverflowTooltip: true },
        { prop: 'handleTime', label: '退回时间', width: 140, slot: TimeCell }
      ],
      emptyText: '暂无退回记录',
      emptyAction: { label: '查看核销', path: '/verification?status=REJECTED' }
    },

    statPendingOutbound: {
      key: 'stat-outbound', title: '待处理出库', type: 'stat',
      value: dashboard.value.pendingOutboundCount || 0,
      subtitle: '今日需处理出库单数',
      color: '#e6a23c', bgColor: '#fdf6ec', icon: Goods
    },

    statPendingVerification: {
      key: 'stat-verification', title: '待处理核销', type: 'stat',
      value: dashboard.value.pendingVerificationCount || 0,
      subtitle: '今日需处理核销单数',
      color: '#409eff', bgColor: '#ecf5ff', icon: Present
    },

    statTimeout: {
      key: 'stat-timeout', title: '超时未处理', type: 'stat',
      value: dashboard.value.timeoutCount || 0,
      subtitle: '超过2小时未处理',
      color: '#f56c6c', bgColor: '#fef0f0', icon: Warning
    },

    statRejected: {
      key: 'stat-rejected', title: '24h内退回', type: 'stat',
      value: dashboard.value.rejectedCount || 0,
      subtitle: '最近退回记录数',
      color: '#909399', bgColor: '#f4f4f5', icon: RefreshLeft
    }
  }

  if (userStore.isBooking) {
    return [
      [
        { ...baseCards.statPendingVerification, span: 12 },
        { ...baseCards.statTimeout, span: 12 }
      ],
      [
        { ...baseCards.pendingAudit, span: 24 }
      ],
      [
        { ...baseCards.timeout, span: 12 },
        { ...baseCards.rejected, span: 12 }
      ]
    ]
  }

  if (userStore.isFloor) {
    return [
      [
        { ...baseCards.statPendingVerification, span: 8 },
        { ...baseCards.statTimeout, span: 8 },
        { ...baseCards.statRejected, span: 8 }
      ],
      [
        { ...baseCards.pendingAudit, span: 12 },
        { ...baseCards.pendingGiftOutbound, span: 12 }
      ],
      [
        { ...baseCards.timeout, span: 12 },
        { ...baseCards.rejected, span: 12 }
      ]
    ]
  }

  if (userStore.isBar) {
    return [
      [
        { ...baseCards.statPendingOutbound, span: 12 },
        { ...baseCards.statTimeout, span: 12 }
      ],
      [
        { ...baseCards.pendingOutbound, span: 12 },
        { ...baseCards.pendingGiftOutbound, span: 12 }
      ],
      [
        { ...baseCards.timeout, span: 12 },
        { ...baseCards.rejected, span: 12 }
      ]
    ]
  }

  return [
    [
      { ...baseCards.statPendingOutbound, span: 6 },
      { ...baseCards.statPendingVerification, span: 6 },
      { ...baseCards.statTimeout, span: 6 },
      { ...baseCards.statRejected, span: 6 }
    ],
    [
      { ...baseCards.pendingOutbound, span: 12 },
      { ...baseCards.pendingAudit, span: 12 }
    ],
    [
      { ...baseCards.pendingGiftOutbound, span: 24 }
    ],
    [
      { ...baseCards.timeout, span: 12 },
      { ...baseCards.rejected, span: 12 }
    ]
  ]
})

const handleQuickAction = (action, row) => {
  if (!action?.path) return
  let path = action.path
  if (action.useId && row?.id) {
    if (action.path.startsWith('/verification')) path = `/verification/${row.id}`
    if (action.path.startsWith('/outbound')) path = `/outbound/${row.id}`
  }
  if (action.useOutboundId && row?.outboundId) {
    path = `/outbound/${row.outboundId}`
  }
  if (action.useType && row) {
    if (row.type === 'OUTBOUND') path = `/outbound/${row.id}`
    else path = `/verification/${row.id}`
  }
  router.push(path)
}

onMounted(() => {
  loadData()
})
</script>
