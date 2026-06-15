import express from 'express'
import cors from 'cors'
import type { Order, UserRole, HistoryNote, Dimension, Attachment } from './types'
import { generateSampleOrders, users } from './data'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

let orders: Order[] = generateSampleOrders()

const generateId = () => Math.random().toString(36).substring(2, 11)

const addHistory = (
  order: Order,
  operator: string,
  role: UserRole,
  action: string,
  content: string
): HistoryNote => {
  const note: HistoryNote = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    operator,
    role,
    action,
    content,
    orderId: order.id,
  }
  order.history.push(note)
  order.updatedAt = note.timestamp
  return note
}

app.get('/api/orders', (req, res) => {
  const role = req.query.role as UserRole | undefined
  const status = req.query.status as string | undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let filtered = [...orders]

  if (role) {
    filtered = filtered.filter((o) => o.currentHandler === role)
  }

  if (status) {
    filtered = filtered.filter((o) => o.status === status)
  }

  filtered.sort((a, b) => {
    const aDate = new Date(a.createdAt)
    const bDate = new Date(b.createdAt)
    return bDate.getTime() - aDate.getTime()
  })

  res.json({ success: true, data: filtered })
})

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }
  res.json({ success: true, data: order })
})

app.get('/api/orders/today/tasks', (req, res) => {
  const role = req.query.role as UserRole | undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const result = {
    pending: [] as Order[],
    urgent: [] as Order[],
    modified: [] as Order[],
  }

  orders.forEach((order) => {
    if (role && order.currentHandler !== role) return

    const isTodayOrEarlier = new Date(order.createdAt) < tomorrow

    if (isTodayOrEarlier) {
      if (order.dimensionModified || order.installTimeModified) {
        result.modified.push(order)
      }

      const installTime = order.installTime ? new Date(order.installTime) : null
      if (installTime && installTime < tomorrow && order.status === 'pending_install') {
        result.urgent.push(order)
      }

      if (order.status !== 'completed') {
        result.pending.push(order)
      }
    }
  })

  result.pending.sort((a, b) => {
    const priority = (o: Order) => {
      const hasSuperseded = o.dimensionReviewHistory.some((r) => r.supersededAt)
      if (o.dimensionModified && hasSuperseded) return 0
      if (o.dimensionModified) return 1
      if (o.installTimeModified) return 2
      if (o.status === 'install_completed') return 3
      if (o.status === 'pending_review') return 4
      if (o.status === 'pending_receipt') return 5
      if (o.status === 'pending_install') return 6
      return 7
    }
    return priority(a) - priority(b)
  })

  res.json({ success: true, data: result })
})

app.post('/api/orders/:id/receive-manuscript', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const {
    manuscriptContent,
    dimension,
    operator,
    note,
  }: {
    manuscriptContent: string
    dimension: Dimension
    operator: string
    note?: string
  } = req.body

  const isModification = order.manuscriptReceived
  const now = new Date().toISOString()

  if (isModification) {
    const oldVersion = order.manuscriptVersion

    const supersededIdx = order.dimensionReviewHistory.findIndex(
      (r) => r.version === oldVersion && !r.supersededAt
    )
    if (supersededIdx >= 0) {
      order.dimensionReviewHistory[supersededIdx].supersededAt = now
    } else if (order.dimensionReviewed) {
      order.dimensionReviewHistory.push({
        version: oldVersion,
        originalDimension: { ...order.originalDimension },
        reviewedDimension: order.reviewedDimension ? { ...order.reviewedDimension } : undefined,
        passed: order.status !== 'review_rejected',
        note: order.dimensionReviewNote,
        reviewedBy: order.dimensionReviewedBy,
        reviewedAt: order.dimensionReviewedAt,
        supersededAt: now,
      })
    }

    const newVersion = oldVersion + 1
    order.manuscriptVersion = newVersion

    order.dimensionReviewHistory.push({
      version: newVersion,
      originalDimension: { ...dimension },
    })

    order.dimensionModified = true
    order.dimensionReviewed = false
    order.reviewedDimension = undefined
    order.dimensionReviewedAt = undefined
    order.dimensionReviewedBy = undefined
    order.dimensionReviewNote = undefined
    order.currentHandler = 'designer'
    order.status = 'pending_review'
  } else {
    order.manuscriptReceived = true
    order.manuscriptReceivedAt = new Date().toISOString()
    order.manuscriptReceivedBy = operator
    order.status = 'pending_review'
    order.currentHandler = 'designer'
  }

  order.manuscriptContent = manuscriptContent
  order.originalDimension = dimension

  addHistory(
    order,
    operator,
    'receiver',
    isModification ? '修改稿件' : '接收稿件',
    note ||
      (isModification
        ? `更新稿件内容，尺寸调整为 ${dimension.width}x${dimension.height}${dimension.unit}`
        : `已接收客户稿件，尺寸 ${dimension.width}x${dimension.height}${dimension.unit}`)
  )

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/review-dimension', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const {
    passed,
    reviewedDimension,
    note,
    operator,
  }: {
    passed: boolean
    reviewedDimension: Dimension
    note?: string
    operator: string
  } = req.body

  order.dimensionReviewed = true
  order.dimensionReviewedAt = new Date().toISOString()
  order.dimensionReviewedBy = operator
  order.dimensionReviewNote = note
  order.reviewedDimension = reviewedDimension
  order.dimensionModified = false

  const existingIdx = order.dimensionReviewHistory.findIndex(
    (r) => r.version === order.manuscriptVersion && !r.reviewedAt
  )
  if (existingIdx >= 0) {
    order.dimensionReviewHistory[existingIdx] = {
      version: order.manuscriptVersion,
      originalDimension: { ...order.originalDimension },
      reviewedDimension: { ...reviewedDimension },
      passed,
      note,
      reviewedBy: operator,
      reviewedAt: new Date().toISOString(),
    }
  } else {
    order.dimensionReviewHistory.push({
      version: order.manuscriptVersion,
      originalDimension: { ...order.originalDimension },
      reviewedDimension: { ...reviewedDimension },
      passed,
      note,
      reviewedBy: operator,
      reviewedAt: new Date().toISOString(),
    })
  }

  if (passed) {
    order.status = 'pending_print'
    order.currentHandler = 'designer'
    addHistory(
      order,
      operator,
      'designer',
      '尺寸复核通过',
      note ||
        `尺寸复核通过：${reviewedDimension.width}x${reviewedDimension.height}${reviewedDimension.unit}`
    )
  } else {
    order.status = 'review_rejected'
    order.currentHandler = 'receiver'
    addHistory(
      order,
      operator,
      'designer',
      '尺寸复核驳回',
      note || '尺寸有问题，请接单员与客户确认后重新提交'
    )
  }

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/confirm-color', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { colorRequirement, operator } = req.body

  order.colorRequirement = colorRequirement
  order.colorConfirmed = true
  order.colorConfirmedAt = new Date().toISOString()
  order.status = 'printing'

  addHistory(order, operator, 'designer', '颜色确认', colorRequirement || '颜色已确认')

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/complete-print', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { operator } = req.body

  order.status = 'pending_install'
  order.currentHandler = 'installer'

  addHistory(order, operator, 'designer', '喷绘完成', '喷绘已完成，待安装')

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/update-install-time', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { installTime, installAddress, operator, note } = req.body

  if (order.installTime && order.installTime !== installTime) {
    order.installTimeModified = true
  }

  order.installTime = installTime
  order.installAddress = installAddress

  addHistory(
    order,
    operator,
    'installer',
    '更新安装信息',
    note || `安装时间：${new Date(installTime).toLocaleString()}，地址：${installAddress}`
  )

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/complete-install', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { operator, note } = req.body

  order.status = 'install_completed'
  order.installTimeModified = false
  order.currentHandler = 'receiver'

  addHistory(order, operator, 'installer', '安装完成', note || '安装已完成，客户已确认，请接单员完成订单归档')

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/complete', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { operator } = req.body

  order.status = 'completed'

  addHistory(order, operator, 'receiver', '订单完成', '订单已完成，已归档')

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/add-note', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { content, operator, role } = req.body

  addHistory(order, operator, role, '添加备注', content)

  res.json({ success: true, data: order })
})

app.post('/api/orders/:id/attachments', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' })
  }

  const { name, type, operator }: { name: string; type: Attachment['type']; operator: string } =
    req.body

  const attachment: Attachment = {
    id: generateId(),
    name,
    type,
    url: `/attachments/${generateId()}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: operator,
  }

  order.attachments.push(attachment)
  order.updatedAt = attachment.uploadedAt

  addHistory(order, operator, order.currentHandler, '上传附件', `上传了${name}`)

  res.json({ success: true, data: attachment })
})

app.get('/api/users', (req, res) => {
  res.json({ success: true, data: users })
})

app.post('/api/reset', (req, res) => {
  orders = generateSampleOrders()
  res.json({ success: true, message: '数据已重置', data: orders })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
