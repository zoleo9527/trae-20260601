import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Row,
  Col,
  Divider,
  Input,
  Form,
  message,
  Modal,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  EditOutlined,
  FileTextOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { api } from '../api'
import dayjs from 'dayjs'

function ExceptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descForm] = Form.useForm()

  const fromPath = searchParams.get('from') || '/exceptions'

  const goBack = () => {
    navigate(fromPath)
  }

  const navigateToFiling = (filingId) => {
    navigate(`/tax-filings/${filingId}?from=${encodeURIComponent(fromPath)}`)
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = () => {
    setLoading(true)
    api.getException(id).then(res => {
      setDetail(res)
      setLoading(false)
    }).catch(() => setLoading(false))
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

  const filingStatusMap = {
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

  const handleAction = (actionType, label) => {
    if (actionType === 'resolve' || actionType === 'start') {
      Modal.confirm({
        title: label,
        content: (
          <div>
            <p>确定要执行此操作吗？</p>
          </div>
        ),
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          return api.exceptionAction(id, actionType, { operator_id: 1, operator_name: '张会计' })
            .then(() => {
              message.success(`${label}成功`)
              fetchDetail()
            })
            .catch(() => message.error(`${label}失败`))
        },
      })
      return
    }

    api.exceptionAction(id, actionType, { operator_id: 1, operator_name: '张会计' })
      .then(() => {
        message.success(`${label}成功`)
        fetchDetail()
      })
      .catch(() => message.error(`${label}失败`))
  }

  const getActionButtons = () => {
    const actions = []
    if (!detail) return actions

    switch (detail.status) {
      case 'open':
        actions.push(
          <Button key="start" type="primary" icon={<PlayCircleOutlined />}
            onClick={() => handleAction('start', '开始处理')}>
            开始处理
          </Button>
        )
        break
      case 'processing':
        actions.push(
          <Button key="resolve" type="primary" icon={<CheckCircleOutlined />}
            onClick={() => handleAction('resolve', '标记解决')}>
            标记解决
          </Button>
        )
        break
      case 'resolved':
        actions.push(
          <Button key="close" icon={<CloseCircleOutlined />}
            onClick={() => handleAction('close', '关闭')}>
            关闭
          </Button>
        )
        break
      case 'closed':
        actions.push(
          <Button key="reopen" icon={<RollbackOutlined />}
            onClick={() => handleAction('reopen', '重新打开')}>
            重新打开
          </Button>
        )
        break
    }
    return actions
  }

  const handleSaveDesc = () => {
    descForm.validateFields().then(values => {
      api.updateExceptionRemark(id, {
        remark: values.description,
        operator_id: 1,
        operator_name: '张会计',
      }).then(res => {
        message.success('描述已更新' + (res.linkedFiling ? '，已同步到关联的税期申报' : ''))
        setEditingDesc(false)
        fetchDetail()
      }).catch(() => message.error('更新失败'))
    })
  }

  if (!detail && !loading) {
    return <div>加载失败</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
          返回列表
        </Button>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <Tag color={typeMap[detail?.type]?.color} icon={typeMap[detail?.type]?.icon}>
                  {typeMap[detail?.type]?.label}
                </Tag>
                <Tag color={priorityMap[detail?.priority]?.color}>
                  {priorityMap[detail?.priority]?.label}
                </Tag>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{detail?.title}</span>
              </Space>
            }
            loading={loading}
            extra={
              <Space>
                <Tag color={statusMap[detail?.status]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {statusMap[detail?.status]?.label}
                </Tag>
                {getActionButtons()}
              </Space>
            }
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="客户名称">
                <div>
                  <div style={{ fontWeight: 500 }}>{detail?.customer_name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{detail?.company_name}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="所属行业">{detail?.industry || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detail?.assigned_name || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{detail?.creator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系人">
                {detail?.contact_person} {detail?.contact_phone}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail?.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {detail?.tax_filing_id && (
                <Descriptions.Item label="关联申报" span={2}>
                  <Button
                    type="link"
                    onClick={() => navigateToFiling(detail.tax_filing_id)}
                    style={{ padding: 0 }}
                  >
                    {detail?.filing_period} {taxTypeMap[detail?.filing_tax_type] || detail?.filing_tax_type}
                    <Tag color={filingStatusMap[detail?.filing_status]?.color} style={{ marginLeft: 8 }}>
                      {filingStatusMap[detail?.filing_status]?.label}
                    </Tag>
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <div className="detail-section">
              <div className="detail-section-title">
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span>详细描述</span>
                  {!editingDesc && (
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingDesc(true)}>
                      编辑
                    </Button>
                  )}
                </Space>
              </div>
              {editingDesc ? (
                <Form form={descForm} initialValues={{ description: detail?.description }}>
                  <Form.Item name="description">
                    <Input.TextArea rows={5} placeholder="请输入详细描述" />
                  </Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleSaveDesc}>保存</Button>
                    <Button onClick={() => setEditingDesc(false)}>取消</Button>
                  </Space>
                  {detail?.tax_filing_id && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#1890ff' }}>
                      💡 已关联税期申报，保存后备注会自动同步
                    </div>
                  )}
                </Form>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.8 }}>
                  {detail?.description || '暂无描述'}
                </div>
              )}
            </div>

            {detail?.related_remark && detail?.tax_filing_id && (
              <>
                <Divider />
                <div className="detail-section">
                  <div className="detail-section-title">关联申报备注</div>
                  <div style={{ padding: '12px 16px', background: '#f0f5ff', borderRadius: 6, borderLeft: '3px solid #1890ff' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>来自关联税期申报的当前备注</div>
                    <div style={{ color: '#333' }}>{detail.related_remark}</div>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card
            title="操作日志"
            style={{ marginTop: 16 }}
            loading={loading}
            extra={<span style={{ color: '#999', fontSize: 12 }}>共 {detail?.logs?.length || 0} 条记录</span>}
          >
            <Timeline
              className="log-timeline"
              items={detail?.logs?.map(log => ({
                color: log.action.includes('退回') || log.action.includes('关闭') ? 'red'
                  : log.action.includes('解决') || log.action.includes('完成') ? 'green'
                    : log.action.includes('创建') ? 'blue' : 'gray',
                children: (
                  <div>
                    <div>
                      <span style={{ fontWeight: 500 }}>{log.action}</span>
                      {log.old_status && log.new_status && (
                        <Tag style={{ marginLeft: 8 }}>
                          {statusMap[log.old_status]?.label || log.old_status} → {statusMap[log.new_status]?.label || log.new_status}
                        </Tag>
                      )}
                      <span className="log-operator">— {log.operator_name}</span>
                    </div>
                    {log.remark && (
                      <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                        {log.remark}
                      </div>
                    )}
                    <div className="log-timestamp" style={{ marginTop: 4 }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理进度" loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>创建时间</span>
                <span>{dayjs(detail?.created_at).format('MM-DD HH:mm')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>当前状态</span>
                <Tag color={statusMap[detail?.status]?.color}>{statusMap[detail?.status]?.label}</Tag>
              </div>
              {detail?.resolved_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>解决时间</span>
                  <span>{dayjs(detail?.resolved_at).format('MM-DD HH:mm')}</span>
                </div>
              )}
            </Space>
          </Card>

          <Card title="客户信息" style={{ marginTop: 16 }} loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="客户">{detail?.customer_name}</Descriptions.Item>
              <Descriptions.Item label="公司">{detail?.company_name}</Descriptions.Item>
              <Descriptions.Item label="联系人">{detail?.contact_person}</Descriptions.Item>
              <Descriptions.Item label="电话">{detail?.contact_phone}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ExceptionDetail
