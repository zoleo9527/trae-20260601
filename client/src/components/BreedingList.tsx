import { useState, useEffect } from 'react'
import { Table, Tag, Input, Button, Card, Space, message, DatePicker } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { breedingApi, cattleApi } from '../api'
import { BreedingRecord, Cattle } from '../types'
import { getStatusText, getBreedingTypeText, formatDate } from '../utils/format'

interface BreedingListProps {
  onSelectRecord: (record: BreedingRecord) => void
}

export default function BreedingList({ onSelectRecord }: BreedingListProps) {
  const [records, setRecords] = useState<BreedingRecord[]>([])
  const [cattleList, setCattleList] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  useEffect(() => {
    loadRecords()
    loadCattle()
  }, [searchKeyword, statusFilter, dateRange])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (dateRange && dateRange[0]) params.startDate = dateRange[0]
      if (dateRange && dateRange[1]) params.endDate = dateRange[1]

      const response = await breedingApi.getRecords(params)
      
      let filteredRecords = response.data
      if (searchKeyword) {
        filteredRecords = filteredRecords.filter(
          (r) =>
            r.cow.tagNumber.includes(searchKeyword) ||
            r.bull.tagNumber.includes(searchKeyword)
        )
      }
      setRecords(filteredRecords)
    } catch (error) {
      message.error('加载繁育记录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCattle = async () => {
    try {
      const response = await cattleApi.getCattle()
      setCattleList(response.data)
    } catch (error) {
      message.error('加载牛只列表失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await breedingApi.deleteRecord(id)
      message.success('删除成功')
      loadRecords()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const statusColors: Record<string, string> = {
    planned: 'orange',
    completed: 'blue',
    successful: 'green',
    failed: 'red',
    aborted: 'gray',
  }

  const columns = [
    {
      title: '母牛',
      key: 'cow',
      width: 100,
      render: (_, record: BreedingRecord) => (
        <div>
          <strong>{record.cow.tagNumber}</strong>
          <p style={{ fontSize: '12px', color: '#999' }}>{record.cow.breed}</p>
        </div>
      ),
    },
    {
      title: '公牛',
      key: 'bull',
      width: 100,
      render: (_, record: BreedingRecord) => (
        <div>
          <strong>{record.bull.tagNumber}</strong>
          <p style={{ fontSize: '12px', color: '#999' }}>{record.bull.breed}</p>
        </div>
      ),
    },
    {
      title: '配种方式',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{getBreedingTypeText(type)}</Tag>,
    },
    {
      title: '配种日期',
      dataIndex: 'breedingDate',
      key: 'breedingDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: '预产期',
      dataIndex: 'expectedCalvingDate',
      key: 'expectedCalvingDate',
      width: 100,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: '实际产犊日',
      dataIndex: 'actualCalvingDate',
      key: 'actualCalvingDate',
      width: 100,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: '犊牛耳标',
      dataIndex: 'calfTagNumber',
      key: 'calfTagNumber',
      width: 100,
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
      width: 80,
      render: (operator: { name: string }) => operator?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {getStatusText(status, 'breeding')}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: BreedingRecord) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onSelectRecord(record)}
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
      title="繁育记录列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加繁育记录
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="搜索耳标号"
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
          <option value="planned">计划中</option>
          <option value="completed">已完成</option>
          <option value="successful">成功</option>
          <option value="failed">失败</option>
          <option value="aborted">终止</option>
        </select>
        <DatePicker.RangePicker
          placeholder={['开始日期', '结束日期']}
          value={dateRange ? [dateRange[0], dateRange[1]] : undefined}
          onChange={(dates) => {
            if (dates) {
              setDateRange([dates[0]?.format('YYYY-MM-DD') || '', dates[1]?.format('YYYY-MM-DD') || ''])
            } else {
              setDateRange(null)
            }
          }}
        />
      </div>

      <Table
        dataSource={records}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}