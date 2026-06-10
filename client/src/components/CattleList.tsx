import { useState, useEffect } from 'react'
import { Table, Tag, Input, Button, Card, Space, message } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { cattleApi } from '../api'
import { Cattle } from '../types'
import { getStatusText, getAge } from '../utils/format'

interface CattleListProps {
  onSelectCattle: (cattle: Cattle) => void
}

export default function CattleList({ onSelectCattle }: CattleListProps) {
  const [cattleList, setCattleList] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadCattle()
  }, [searchKeyword, statusFilter])

  const loadCattle = async () => {
    setLoading(true)
    try {
      const response = await cattleApi.getCattle({
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
      })
      setCattleList(response.data)
    } catch (error) {
      message.error('加载牛只列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await cattleApi.deleteCattle(id)
      message.success('删除成功')
      loadCattle()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const statusColors: Record<string, string> = {
    healthy: 'green',
    sick: 'red',
    pregnant: 'purple',
    calving: 'orange',
    sold: 'gray',
    dead: 'red',
  }

  const columns = [
    {
      title: '耳标号',
      dataIndex: 'tagNumber',
      key: 'tagNumber',
      width: 100,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '品种',
      dataIndex: 'breed',
      key: 'breed',
      width: 100,
    },
    {
      title: '年龄',
      key: 'age',
      width: 80,
      render: (_: unknown, record: Cattle) => getAge(record.birthDate),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
    },
    {
      title: '体重(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {getStatusText(status, 'cattle')}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Cattle) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onSelectCattle(record)}
          >
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="牛只档案列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加牛只
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Input
          placeholder="搜索耳标号或品种"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 250 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
        >
          <option value="">全部状态</option>
          <option value="healthy">健康</option>
          <option value="sick">生病</option>
          <option value="pregnant">怀孕</option>
          <option value="calving">待产</option>
          <option value="sold">已出售</option>
          <option value="dead">已死亡</option>
        </select>
      </div>

      <Table
        dataSource={cattleList}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}