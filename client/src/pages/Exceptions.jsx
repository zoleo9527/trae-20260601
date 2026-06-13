import React, { useState, useEffect, useMemo } from 'react'
import { Table, Tag, Button, Space, Select, Input, Modal, Form, message, Tooltip, Radio, Card, Row, Col, Empty } from 'antd'
import {
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  SyncOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import dayjs from 'dayjs'

function Exceptions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ list: [], total: 0 })
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [remarkModal, setRemarkModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [remarkForm] = Form.useForm()
  const [customers, setCustomers] = useState([])

  const statusTab = searchParams.get('status') || 'all'
  const typeFilter = searchParams.get('type') || undefined
  const priorityFilter = searchParams.get('priority') || undefined
  const keyword = searchParams.get('keyword') || ''
  const currentPage = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const activeTypeCard = typeFilter || 'all'

  const hasActiveFilter = (typeFilter) || priorityFilter || keyword || (statusTab !== 'all')

  useEffect(() => {
    fetchStats()
    api.getCustomers({ pageSize: 100 }).then(res => setCustomers(res.list))
  }, [])

  useEffect(() => {
    fetchData()
  }, [searchParams.toString()])

  const fetchStats = () => {
    api.getExceptionStats().then(setStats)
  }

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    if (updates.page === undefined) {
      newParams.set('page', '1')
    }
    setSearchParams(newParams, { replace: false })
  }

  const clearAllFilters = () => {
    const newParams = new URLSearchParams()
    newParams.set('page', '1')
    newParams.set('pageSize', pageSize.toString())
    setSearchParams(newParams, { replace: false })
  }

  const fetchData = () => {
    setLoading(true)
    const params = {
      page: currentPage,
      pageSize: pageSize,
    }

    if (statusTab === 'open') {
      params.status = 'open,processing'
    } else if (statusTab !== 'all') {
      params.status = statusTab
    }

    if (typeFilter) {
      params.type = typeFilter
    }

    if (priorityFilter) {
      params.priority = priorityFilter
    }

    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim()
    }

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '' || params[key] === null) delete params[key]
    })
    api.getExceptions(params).then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const handleTypeCardClick = (typeKey) => {
    updateParams({ type: typeKey === 'all' ? undefined : typeKey })
  }

  const handleStatusChange = (value) => {
    updateParams({ status: value === 'all' ? undefined : value })
  }

  const typeMap = {
    urge: { label: '催收提醒', color: 'orange', icon: <BellOutlined /> },
    reject: { label: '退回异常', color: 'red', icon: <ExclamationCircleOutlined /> },
    supplement: { label: '补材料提醒', color: 'blue', icon: <FileTextOutlined /> },
  }

  const statusMap = {
    open: { label: '待处理', color: 'error' },
    processing: { label: '处理中', color: 'processing' },
    resolved: { label: '已解决', color: 'success' },
    closed: { label: '已关闭', color: 'default' },
  }

  const priorityMap = {
    urgent: { label: '紧急', color: 'red' },
    high: { label: '高', color: 'orange' },
    normal: { label: '普通', color: 'blue' },
    low: { label: '低', color: 'default' },
  }

  const handleAction = (record, actionType, label) => {
    const confirmText = {
      start: `确定要开始处理「${record.title}」吗？`,
      resolve: `确定要标记「${record.title}」为已解决吗？`,
      close: `确定要关闭「${record.title}」吗？`,
      reopen: `确定要重新打开「${record.title}」吗？`,
    }

    if (actionType === 'resolve' || actionType === 'start') {
      setCurrentRecord(record)
      remarkForm.setFieldsValue({ remark: record.description || '' })
      setRemarkModal({ visible: true, actionType, label })
      return
    }

    Modal.confirm({
      title: label,
      content: confirmText[actionType],
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        return api.exceptionAction(record.id, actionType, { operator_id: 1, operator_name: '张会计' })
          .then(() => {
            message.success(`${label}成功`)
            fetchData()
            fetchStats()
          })
          .catch(err => {
            message.error(`${label}失败`)
          })
      },
    })
  }

  const handleRemarkSubmit = () => {
    remarkForm.validateFields().then(values => {
      api.exceptionAction(currentRecord.id, remarkModal.actionType, {
        remark: values.remark,
        operator_id: 1,
        operator_name: '张会计',
      }).then(() => {
        message.success(`${remarkModal.label}成功`)
        setRemarkModal(false)
        setCurrentRecord(null)
        fetchData()
        fetchStats()
      }).catch(() => {
        message.error(`${remarkModal.label}失败`)
      })
    })
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      api.createException({
        ...values,
        operator_id: 1,
        operator_name: '张会计',
      }).then(() => {
        message.success('创建成功')
        setCreateModal(false)
        form.resetFields()
        fetchData()
        fetchStats()
      }).catch(() => {
        message.error('创建失败')
      })
    })
  }

  const getActionButtons = (record) => {
    const actions = []
    const stop = (e) => e.stopPropagation()

    switch (record.status) {
      case 'open':
        actions.push(
          <Button key="start" type="primary" size="small" icon={<PlayCircleOutlined />}
            onClick={(e) => { stop(e); handleAction(record, 'start', '开始处理') }}>
            开始处理
          </Button>
        )
        break
      case 'processing':
        actions.push(
          <Button key="resolve" type="primary" size="small" icon={<CheckCircleOutlined />}
            onClick={(e) => { stop(e); handleAction(record, 'resolve', '标记解决') }}>
            标记解决
          </Button>
        )
        break
      case 'resolved':
        actions.push(
          <Button key="close" size="small" icon={<CloseCircleOutlined />}
            onClick={(e) => { stop(e); handleAction(record, 'close', '关闭') }}>
            关闭
          </Button>
        )
        break
      case 'closed':
        actions.push(
          <Button key="reopen" size="small" icon={<RollbackOutlined />}
            onClick={(e) => { stop(e); handleAction(record, 'reopen', '重新打开') }}>
            重新打开
          </Button>
        )
        break
    }
    actions.push(
      <Button key="view" size="small" icon={<EyeOutlined />}
        onClick={(e) => { stop(e); navigate(`/exceptions/${record.id}`) }}>
        详情
      </Button>
    )
    return actions
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: t => (
        <Tag color={typeMap[t]?.color} icon={typeMap[t]?.icon}>
          {typeMap[t]?.label}
        </Tag>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 130,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.company_name}</div>
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: text => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: p => <Tag color={priorityMap[p]?.color}>{priorityMap[p]?.label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    {
      title: '处理人',
      dataIndex: 'assigned_name',
      key: 'assigned_name',
      width: 90,
      render: t => t || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {getActionButtons(record)}
        </Space>
      ),
    },
  ]

  const statCards = [
    { key: 'all', label: '全部待处理', value: stats.totalOpen || 0, color: '#1890ff' },
    { key: 'urge', label: '催收提醒', value: stats.urgeCount || 0, color: '#fa8c16' },
    { key: 'reject', label: '退回异常', value: stats.rejectCount || 0, color: '#ff4d4f' },
    { key: 'supplement', label: '补材料', value: stats.supplementCount || 0, color: '#1890ff' },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map(card => (
          <Col span={6} key={card.key}>
            <Card
              hoverable
              onClick={() => handleTypeCardClick(card.key)}
              style={{
                cursor: 'pointer',
                borderLeft: `4px solid ${card.color}`,
                background: activeTypeCard === card.key ? '#e6f7ff' : '#fff',
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Space direction="vertical" size={4}>
                <span style={{ fontSize: 12, color: '#999' }}>{card.label}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</span>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="action-bar">
        <Space wrap>
          <Radio.Group value={statusTab} onChange={e => handleStatusChange(e.target.value)}>
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="open">待处理</Radio.Button>
            <Radio.Button value="resolved">已解决</Radio.Button>
            <Radio.Button value="closed">已关闭</Radio.Button>
          </Radio.Group>
          <Select
            placeholder="类型筛选"
            style={{ width: 130 }}
            allowClear
            value={typeFilter}
            onChange={v => updateParams({ type: v })}
          >
            {Object.entries(typeMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="优先级"
            style={{ width: 110 }}
            allowClear
            value={priorityFilter}
            onChange={v => updateParams({ priority: v })}
          >
            {Object.entries(priorityMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Input.Search
            placeholder="搜索标题/客户"
            style={{ width: 220 }}
            allowClear
            value={keyword}
            onChange={e => {
              if (!e.target.value) updateParams({ keyword: '' })
            }}
            onSearch={value => updateParams({ keyword: value || '' })}
          />
          {hasActiveFilter && (
            <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
              清空筛选
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            新建提醒
          </Button>
          <Button icon={<SyncOutlined />} onClick={() => { fetchData(); fetchStats() }}>
            刷新
          </Button>
        </Space>
      </div>

      {!loading && data.list.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty
            description={
              <div>
                {hasActiveFilter ? (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      当前筛选条件下没有数据
                    </div>
                    <Space size="small" wrap style={{ justifyContent: 'center' }}>
                      {statusTab !== 'all' && <Tag closable onClose={() => handleStatusChange('all')}>
                        状态：{statusTab === 'open' ? '待处理' : statusTab === 'resolved' ? '已解决' : '已关闭'}
                      </Tag>}
                      {typeFilter && <Tag closable onClose={() => updateParams({ type: undefined })}>
                        类型：{typeMap[typeFilter]?.label || typeFilter}
                      </Tag>}
                      {priorityFilter && <Tag closable onClose={() => updateParams({ priority: undefined })}>
                        优先级：{priorityMap[priorityFilter]?.label || priorityFilter}
                      </Tag>}
                      {keyword && <Tag closable onClose={() => updateParams({ keyword: '' })}>
                        关键词：{keyword}
                      </Tag>}
                    </Space>
                    <div style={{ marginTop: 16 }}>
                      <Button type="primary" onClick={clearAllFilters}>
                        一键清空筛选
                      </Button>
                    </div>
                  </div>
                ) : (
                  '暂无异常提醒'
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <Table
          columns={columns}
          dataSource={data.list}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          onRow={(record) => ({
            onClick: () => navigate(`/exceptions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (page, size) => updateParams({ page: page.toString(), pageSize: size.toString() }),
          }}
        />
      )}

      <Modal
        title="新建异常提醒"
        open={createModal}
        onOk={handleCreate}
        onCancel={() => setCreateModal(false)}
        okText="创建"
        cancelText="取消"
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择异常类型">
              {Object.entries(typeMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户" showSearch optionFilterProp="children">
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name} - {c.company_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入简短标题" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select defaultValue="normal">
              {Object.entries(priorityMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={4} placeholder="请详细描述异常情况和处理要求" />
          </Form.Item>
          <Form.Item name="assigned_to" label="指派给">
            <Select placeholder="选择处理人" allowClear>
              <Select.Option value={1}>张会计</Select.Option>
              <Select.Option value={2}>李会计</Select.Option>
              <Select.Option value={3}>王经理</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={remarkModal.label || '操作'}
        open={remarkModal.visible}
        onOk={handleRemarkSubmit}
        onCancel={() => setRemarkModal(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={remarkForm} layout="vertical">
          <Form.Item name="remark" label="处理说明">
            <Input.TextArea rows={4} placeholder="请输入处理说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Exceptions
