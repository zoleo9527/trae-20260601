import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Select, Input, Modal, Form, DatePicker, message, Tooltip } from 'antd'
import {
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  FileDoneOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import dayjs from 'dayjs'

function TaxFilings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState({ list: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || undefined,
    period: searchParams.get('period') || undefined,
    tax_type: undefined,
    keyword: '',
  })
  const [createModal, setCreateModal] = useState(false)
  const [remarkModal, setRemarkModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [remarkForm] = Form.useForm()
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetchData()
    api.getCustomers({ pageSize: 100 }).then(res => setCustomers(res.list))
  }, [])

  const fetchData = () => {
    setLoading(true)
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...filters,
    }
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') delete params[key]
    })
    api.getTaxFilings(params).then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize, filters])

  const statusMap = {
    pending: { label: '待处理', color: 'default' },
    in_progress: { label: '处理中', color: 'processing' },
    submitted: { label: '已提交', color: 'blue' },
    approved: { label: '审核通过', color: 'success' },
    rejected: { label: '已退回', color: 'error' },
    completed: { label: '已完成', color: 'success' },
  }

  const taxTypeMap = {
    vat: '增值税',
    income: '企业所得税',
    personal_income: '个税',
    additional: '附加税',
  }

  const handleAction = (record, actionType, label) => {
    const confirmText = {
      start: `确定要开始处理「${record.customer_name} ${record.period}」的申报吗？`,
      submit: `确定要提交「${record.customer_name} ${record.period}」的申报吗？`,
      approve: `确定要审核通过「${record.customer_name} ${record.period}」的申报吗？`,
      reject: `确定要退回「${record.customer_name} ${record.period}」的申报吗？退回后将自动创建异常提醒。`,
      complete: `确定要完成归档「${record.customer_name} ${record.period}」的申报吗？`,
      reopen: `确定要重新打开「${record.customer_name} ${record.period}」的申报吗？`,
    }

    if (actionType === 'reject' || actionType === 'submit') {
      setCurrentRecord(record)
      remarkForm.setFieldsValue({ remark: record.current_remark || '' })
      setRemarkModal({ visible: true, actionType, label })
      return
    }

    Modal.confirm({
      title: label,
      content: confirmText[actionType],
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        return api.filingAction(record.id, actionType, { operator_id: 1, operator_name: '张会计' })
          .then(() => {
            message.success(`${label}成功`)
            fetchData()
          })
          .catch(err => {
            message.error(`${label}失败`)
          })
      },
    })
  }

  const handleRemarkSubmit = () => {
    remarkForm.validateFields().then(values => {
      api.filingAction(currentRecord.id, remarkModal.actionType, {
        remark: values.remark,
        operator_id: 1,
        operator_name: '张会计',
      }).then(() => {
        message.success(`${remarkModal.label}成功`)
        setRemarkModal(false)
        setCurrentRecord(null)
        fetchData()
      }).catch(() => {
        message.error(`${remarkModal.label}失败`)
      })
    })
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      api.createTaxFiling({
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD'),
        operator_id: 1,
        operator_name: '张会计',
      }).then(() => {
        message.success('创建成功')
        setCreateModal(false)
        form.resetFields()
        fetchData()
      }).catch(() => {
        message.error('创建失败')
      })
    })
  }

  const getActionButtons = (record) => {
    const actions = []
    switch (record.status) {
      case 'pending':
        actions.push(
          <Button key="start" type="primary" size="small" icon={<PlayCircleOutlined />}
            onClick={() => handleAction(record, 'start', '开始处理')}>
            开始处理
          </Button>
        )
        break
      case 'in_progress':
        actions.push(
          <Button key="submit" type="primary" size="small" icon={<CheckCircleOutlined />}
            onClick={() => handleAction(record, 'submit', '提交申报')}>
            提交申报
          </Button>
        )
        break
      case 'submitted':
        actions.push(
          <Button key="approve" type="primary" size="small" icon={<CheckCircleOutlined />}
            onClick={() => handleAction(record, 'approve', '审核通过')}>
            通过
          </Button>
        )
        actions.push(
          <Button key="reject" danger size="small" icon={<CloseCircleOutlined />}
            onClick={() => handleAction(record, 'reject', '退回')}>
            退回
          </Button>
        )
        break
      case 'approved':
        actions.push(
          <Button key="complete" type="primary" size="small" icon={<FileDoneOutlined />}
            onClick={() => handleAction(record, 'complete', '完成归档')}>
            完成
          </Button>
        )
        break
      case 'rejected':
        actions.push(
          <Button key="reopen" size="small" icon={<RollbackOutlined />}
            onClick={() => handleAction(record, 'reopen', '重新打开')}>
            重新处理
          </Button>
        )
        break
      case 'completed':
        actions.push(
          <Button key="reopen" size="small" icon={<RollbackOutlined />}
            onClick={() => handleAction(record, 'reopen', '重新打开')}>
            重新打开
          </Button>
        )
        break
    }
    actions.push(
      <Button key="view" size="small" icon={<EyeOutlined />}
        onClick={() => navigate(`/tax-filings/${record.id}`)}>
        详情
      </Button>
    )
    return actions
  }

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 160,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.company_name}</div>
        </div>
      ),
    },
    {
      title: '税期',
      dataIndex: 'period',
      key: 'period',
      width: 100,
    },
    {
      title: '税种',
      dataIndex: 'tax_type',
      key: 'tax_type',
      width: 100,
      render: t => taxTypeMap[t] || t,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date) => {
        const days = dayjs(date).diff(dayjs(), 'day')
        let color = ''
        if (days < 0) color = 'red'
        else if (days <= 3) color = 'orange'
        return <span style={{ color }}>{date}</span>
      },
    },
    {
      title: '负责会计',
      dataIndex: 'accountant_name',
      key: 'accountant_name',
      width: 100,
    },
    {
      title: '当前备注',
      dataIndex: 'current_remark',
      key: 'current_remark',
      ellipsis: true,
      render: text => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ color: '#666' }}>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {getActionButtons(record)}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="action-bar">
        <Space wrap>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={v => setFilters({ ...filters, status: v })}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="税种筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.tax_type}
            onChange={v => setFilters({ ...filters, tax_type: v })}
          >
            {Object.entries(taxTypeMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val}</Select.Option>
            ))}
          </Select>
          <Input
            placeholder="搜索客户名称"
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => {
              setPagination({ ...pagination, current: 1 })
              fetchData()
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            新建申报
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data.list}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: t => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
      />

      <Modal
        title="新建申报记录"
        open={createModal}
        onOk={handleCreate}
        onCancel={() => setCreateModal(false)}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户">
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="period" label="税期" rules={[{ required: true, message: '请输入税期' }]}>
            <Input placeholder="如：2026-05" />
          </Form.Item>
          <Form.Item name="tax_type" label="税种" rules={[{ required: true, message: '请选择税种' }]}>
            <Select placeholder="请选择税种">
              {Object.entries(taxTypeMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="current_remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
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
          <Form.Item name="remark" label="备注说明">
            <Input.TextArea rows={4} placeholder="请输入备注说明" />
          </Form.Item>
          {remarkModal.actionType === 'reject' && (
            <div style={{ color: '#fa8c16', fontSize: 12, padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
              提示：退回后将自动创建一条「退回异常」提醒，备注会同步到异常提醒中。
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default TaxFilings
