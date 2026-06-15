import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Tag, Space, Button, Select, Input, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Order, User } from '../types'
import { orderApi } from '../api'
import { statusMap, roleMap } from '../types'

const { Title, Text } = Typography
const { Option } = Select

interface Props {
  currentUser: User
}

export default function OrderList({ currentUser }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [roleFilter, setRoleFilter] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter, roleFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getList(
        roleFilter as any,
        statusFilter
      )
      if (res.data.success) {
        setOrders(res.data.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      !searchText ||
      o.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
      o.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text, record) => (
        <Link to={`/orders/${record.id}`} style={{ fontWeight: 500 }}>
          {text}
        </Link>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text, record) => (
        <Space>
          {text}
          {record.dimensionModified && <Tag color="red">尺寸已改</Tag>}
          {record.installTimeModified && !record.dimensionModified && (
            <Tag color="orange">安装时间变更</Tag>
          )}
          {record.manuscriptVersion > 1 && (
            <Tag color="purple">v{record.manuscriptVersion}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '尺寸',
      key: 'dimension',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            {record.originalDimension.width} × {record.originalDimension.height}{' '}
            {record.originalDimension.unit}
          </Text>
          {record.reviewedDimension && (
            <Text type="success" style={{ fontSize: '12px' }}>
              ✓ 复核 {record.reviewedDimension.width} × {record.reviewedDimension.height}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Order['status']) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '当前处理',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 100,
      render: (role: Order['currentHandler']) => roleMap[role],
    },
    {
      title: '安装时间',
      dataIndex: 'installTime',
      key: 'installTime',
      width: 160,
      render: (time, record) =>
        time ? (
          <Text type={record.installTimeModified ? 'warning' : undefined}>
            {dayjs(time).format('MM-DD HH:mm')}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Link to={`/orders/${record.id}`}>
          <Button type="link" size="small">
            查看详情
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>
          全部订单
        </Title>

        <Space>
          <Input
            placeholder="搜索订单号/项目/客户"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="按状态筛选"
            style={{ width: 140 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val.text}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="按处理角色筛选"
            style={{ width: 140 }}
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
          >
            {Object.entries(roleMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val}
              </Option>
            ))}
          </Select>
          <Button onClick={loadOrders}>刷新</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          size="middle"
        />
      </Space>
    </div>
  )
}
