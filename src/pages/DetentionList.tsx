import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tabs, Space, Input, Select, Card, message, Row, Col, Switch, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchDetentions } from '../api'
import { DETAIN_REASON_LABELS, STATUS_LABELS, STATUS_COLORS } from '../types'
import type { Detention, DetainReason, DetentionStatus } from '../types'
import StatusBadge from '../components/StatusBadge'

const statusTabs: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'detained', label: '已扣留' },
  { key: 'supplementing', label: '补证中' },
  { key: 'reviewing', label: '复核中' },
  { key: 'released', label: '已放行' },
  { key: 'returned', label: '已退回' },
]

const statusKeys: DetentionStatus[] = ['detained', 'supplementing', 'reviewing', 'released', 'returned']

const statusCardColors: Record<DetentionStatus, string> = {
  detained: '#ff4d4f',
  supplementing: '#fa8c16',
  reviewing: '#1677ff',
  released: '#52c41a',
  returned: '#8c8c8c',
}

export default function DetentionList() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState<Detention[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [reason, setReason] = useState<string | undefined>(undefined)
  const [overdueOnly, setOverdueOnly] = useState(false)

  const isOverdue = useCallback((d: Detention) => {
    if (d.status === 'released' || d.status === 'returned') return false
    const hours = dayjs().diff(dayjs(d.detainTime), 'hour', true)
    return hours > 72
  }, [])

  const formatDuration = useCallback((d: Detention) => {
    const minutes = dayjs().diff(dayjs(d.detainTime), 'minute')
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return `${days}天${hours}小时`
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchDetentions()
      setAllData(list)
    } catch {
      message.error('获取扣留列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allData.length }
    for (const s of statusKeys) {
      counts[s] = allData.filter((d) => d.status === s).length
    }
    return counts
  }, [allData])

  const overdueCount = useMemo(() => {
    return allData.filter((d) => isOverdue(d)).length
  }, [allData, isOverdue])

  const filteredData = useMemo(() => {
    let list = allData
    if (activeTab !== 'all') {
      list = list.filter((d) => d.status === activeTab)
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (d) =>
          d.waybillNo.toLowerCase().includes(kw) ||
          d.goodsName.toLowerCase().includes(kw) ||
          d.declaredGoodsName.toLowerCase().includes(kw),
      )
    }
    if (reason) {
      list = list.filter((d) => d.detainReason === reason)
    }
    if (overdueOnly) {
      list = list.filter((d) => isOverdue(d))
    }
    return list
  }, [allData, activeTab, keyword, reason, overdueOnly, isOverdue])

  const columns = [
    { title: '运单号', dataIndex: 'waybillNo', key: 'waybillNo' },
    { title: '货物品名', dataIndex: 'goodsName', key: 'goodsName' },
    { title: '申报品名', dataIndex: 'declaredGoodsName', key: 'declaredGoodsName' },
    {
      title: '扣留原因',
      dataIndex: 'detainReason',
      key: 'detainReason',
      render: (v: DetainReason) => DETAIN_REASON_LABELS[v] ?? v,
    },
    {
      title: '扣留时间',
      dataIndex: 'detainTime',
      key: 'detainTime',
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '扣留时长',
      key: 'duration',
      render: (_: unknown, record: Detention) => {
        const overdue = isOverdue(record)
        const text = formatDuration(record)
        return overdue ? (
          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
            {text} <Tag color="red">超期</Tag>
          </span>
        ) : (
          text
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DetentionStatus) => <StatusBadge status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Detention) => (
        <Button type="link" onClick={() => navigate(`/detail/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statusKeys.map((s) => (
          <Col span={Math.floor(24 / statusKeys.length)} key={s}>
            <Card
              hoverable
              size="small"
              style={{
                borderLeft: `3px solid ${statusCardColors[s]}`,
                background: activeTab === s ? '#f0f5ff' : undefined,
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab(s)}
            >
              <div style={{ fontSize: 14, color: '#666' }}>{STATUS_LABELS[s]}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: statusCardColors[s] }}>
                {statusCounts[s] ?? 0}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      {overdueCount > 0 && (
        <div style={{ marginBottom: 12, fontSize: 13, color: '#ff4d4f' }}>
          当前有 <strong>{overdueCount}</strong> 件扣留记录已超过 72 小时未处理
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs.map((tab) => ({
            key: tab.key,
            label: tab.key === 'all' ? `全部 (${statusCounts.all ?? 0})` : `${tab.label} (${statusCounts[tab.key] ?? 0})`,
          }))}
          style={{ marginBottom: 0 }}
        />
        <Space>
          <Input
            placeholder="运单号/品名/申报品名"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder="扣留原因"
            allowClear
            style={{ width: 160 }}
            value={reason}
            onChange={(v) => setReason(v)}
            options={Object.entries(DETAIN_REASON_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            仅看超期 <Switch size="small" checked={overdueOnly} onChange={setOverdueOnly} />
          </span>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/register')}>
            新建扣留登记
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/detail/${record.id}`),
        })}
      />
    </div>
  )
}
