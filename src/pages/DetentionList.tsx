import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tabs, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchDetentions } from '../api'
import { DETAIN_REASON_LABELS } from '../types'
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

export default function DetentionList() {
  const navigate = useNavigate()
  const [data, setData] = useState<Detention[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadData = async (status?: string) => {
    setLoading(true)
    try {
      const list = await fetchDetentions(status)
      setData(list)
    } catch {
      message.error('获取扣留列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(activeTab === 'all' ? undefined : activeTab)
  }, [activeTab])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/register')}>
          新建扣留登记
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/detail/${record.id}`),
        })}
      />
    </div>
  )
}
