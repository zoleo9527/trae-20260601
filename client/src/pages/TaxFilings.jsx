import React, { useState, useEffect, useMemo } from 'react'
import { Table, Tag, Button, Space, Select, Input, Modal, Form, DatePicker, message, Tooltip, Empty, Card } from 'antd'
import {
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  FileDoneOutlined,
  SearchOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { api } from '../api'
import dayjs from 'dayjs'

function TaxFilings() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ list: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [remarkModal, setRemarkModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [remarkForm] = Form.useForm()
  const [customers, setCustomers] = useState([])

  const statusFilter = searchParams.get('status') || undefined
  const taxTypeFilter = searchParams.get('tax_type') || undefined
  const keyword = searchParams.get('keyword') || ''
  const currentPage = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const hasActiveFilter = statusFilter || taxTypeFilter || keyword

  const currentListPath = `${location.pathname}${location.search}`

  const navigateToDetail = (id) => {
    navigate(`/tax-filings/${id}?from=${encodeURIComponent(currentListPath)}`)
  }

  useEffect(() => {
    api.getCustomers({ pageSize: 100 }).then(res => setCustomers(res.list))
  }, [])

  useEffect(() => {
    fetchData()
  }, [searchParams.toString()])

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
      status: statusFilter,
      tax_type: taxTypeFilter,
      keyword: keyword || undefined,
    }
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') delete params[key]
    })
    api.getTaxFilings(params).then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

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
        onClick={() => navigateToDetail(record.id)}>
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
            value={statusFilter}
            onChange={v => updateParams({ status: v })}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="税种筛选"
            style={{ width: 120 }}
            allowClear
            value={taxTypeFilter}
            onChange={v => updateParams({ tax_type: v })}
          >
            {Object.entries(taxTypeMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val}</Select.Option>
            ))}
          </Select>
          <Input.Search
            placeholder="搜索客户/备注"
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
            新建申报
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
                  {statusFilter && <Tag closable onClose={() => updateParams({ status: undefined })}>
                    状态：{statusMap[statusFilter]?.label || statusFilter}
                  </Tag>}
                  {taxTypeFilter && <Tag closable onClose={() => updateParams({ tax_type: undefined })}>
                    税种：{taxTypeMap[taxTypeFilter] || taxTypeFilter}
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
              '暂无申报记录'
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
          scroll={{ x: 1200 }}
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
