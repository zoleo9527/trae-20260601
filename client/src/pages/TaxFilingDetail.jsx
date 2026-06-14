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
  List,
  Modal,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  RollbackOutlined,
  EditOutlined,
  EyeOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { api } from '../api'
import dayjs from 'dayjs'
import { parseTaxFilingFromUrl } from '../utils/fromUrl'

function TaxFilingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingRemark, setEditingRemark] = useState(false)
  const [remarkForm] = Form.useForm()

  const fromPath = searchParams.get('from') || '/tax-filings'
  const fromInfo = parseTaxFilingFromUrl(searchParams.get('from') || '')

  const goBack = () => {
    navigate(fromPath)
  }

  const goToCleanList = () => {
    navigate('/tax-filings')
  }

  const navigateToException = (exceptionId) => {
    navigate(`/exceptions/${exceptionId}?from=${encodeURIComponent(fromPath)}`)
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = () => {
    setLoading(true)
    api.getTaxFiling(id).then(res => {
      setDetail(res)
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

  const exceptionTypeMap = {
    urge: { label: '催收提醒', color: 'orange', icon: <BellOutlined /> },
    reject: { label: '退回异常', color: 'red', icon: <ExclamationCircleOutlined /> },
    supplement: { label: '补材料提醒', color: 'blue', icon: <FileTextOutlined /> },
  }

  const exceptionStatusMap = {
    open: { label: '待处理', color: 'error' },
    processing: { label: '处理中', color: 'processing' },
    resolved: { label: '已解决', color: 'success' },
    closed: { label: '已关闭', color: 'default' },
  }

  const handleAction = (actionType, label) => {
    if (actionType === 'reject' || actionType === 'submit') {
      Modal.confirm({
        title: label,
        content: (
          <div>
            <p>确定要执行此操作吗？</p>
            {actionType === 'reject' && (
              <p style={{ color: '#fa8c16' }}>提示：退回后将自动创建一条「退回异常」提醒。</p>
            )}
          </div>
        ),
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          return api.filingAction(id, actionType, { operator_id: 1, operator_name: '张会计' })
            .then(() => {
              message.success(`${label}成功`)
              fetchDetail()
            })
            .catch(() => message.error(`${label}失败`))
        },
      })
      return
    }

    api.filingAction(id, actionType, { operator_id: 1, operator_name: '张会计' })
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
      case 'pending':
        actions.push(
          <Button key="start" type="primary" icon={<PlayCircleOutlined />}
            onClick={() => handleAction('start', '开始处理')}>
            开始处理
          </Button>
        )
        break
      case 'in_progress':
        actions.push(
          <Button key="submit" type="primary" icon={<CheckCircleOutlined />}
            onClick={() => handleAction('submit', '提交申报')}>
            提交申报
          </Button>
        )
        break
      case 'submitted':
        actions.push(
          <Button key="approve" type="primary" icon={<CheckCircleOutlined />}
            onClick={() => handleAction('approve', '审核通过')}>
            审核通过
          </Button>
        )
        actions.push(
          <Button key="reject" danger icon={<CloseCircleOutlined />}
            onClick={() => handleAction('reject', '退回申报')}>
            退回
          </Button>
        )
        break
      case 'approved':
        actions.push(
          <Button key="complete" type="primary" icon={<FileDoneOutlined />}
            onClick={() => handleAction('complete', '完成归档')}>
            完成归档
          </Button>
        )
        break
      case 'rejected':
      case 'completed':
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

  const handleSaveRemark = () => {
    remarkForm.validateFields().then(values => {
      api.updateFilingRemark(id, {
        remark: values.remark,
        operator_id: 1,
        operator_name: '张会计',
      }).then(res => {
        message.success('备注已更新' + (res.updatedRelated > 0 ? `，已同步到 ${res.updatedRelated} 条关联异常` : ''))
        setEditingRemark(false)
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
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {fromInfo?.isFromDashboard ? '返回工作台' : '返回原队列'}
          </Button>
          {fromInfo?.isFromList && fromInfo?.hasFilter && (
            <Button type="link" onClick={goToCleanList}>
              清空筛选，查看全列表
            </Button>
          )}
        </Space>
      </div>

      {fromInfo?.isFromList && fromInfo?.hasFilter && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space size="small" wrap>
              <span style={{ color: '#666' }}>来源队列：</span>
              {fromInfo.labels.map(item => (
                <Tag key={item.key}>{item.label}</Tag>
              ))}
            </Space>
          }
        />
      )}

      <Row gutter={24}>
        <Col span={16}>
          <Card
            title="申报信息"
            loading={loading}
            extra={
              <Space>
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
              <Descriptions.Item label="税期">{detail?.period}</Descriptions.Item>
              <Descriptions.Item label="税种">{taxTypeMap[detail?.tax_type] || detail?.tax_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail?.status]?.color}>
                  {statusMap[detail?.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="截止日期">{detail?.due_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责会计">{detail?.accountant_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户经理">{detail?.manager_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系人">
                {detail?.contact_person} {detail?.contact_phone}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail?.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="detail-section">
              <div className="detail-section-title">当前备注</div>
              {editingRemark ? (
                <Form form={remarkForm} initialValues={{ remark: detail?.current_remark }}>
                  <Form.Item name="remark">
                    <Input.TextArea rows={4} placeholder="请输入备注" />
                  </Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleSaveRemark}>保存</Button>
                    <Button onClick={() => setEditingRemark(false)}>取消</Button>
                  </Space>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    💡 备注会自动同步到关联的异常提醒中
                  </div>
                </Form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, whiteSpace: 'pre-wrap', color: '#333' }}>
                    {detail?.current_remark || '暂无备注'}
                  </div>
                  <Button type="text" icon={<EditOutlined />} onClick={() => setEditingRemark(true)}>
                    编辑
                  </Button>
                </div>
              )}
            </div>
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
                color: log.action.includes('退回') || log.action.includes('拒绝') ? 'red'
                  : log.action.includes('完成') || log.action.includes('通过') ? 'green'
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
          <Card
            title="关联异常提醒"
            loading={loading}
            extra={<span style={{ color: '#999', fontSize: 12 }}>{detail?.relatedExceptions?.length || 0} 条</span>}
          >
            {detail?.relatedExceptions?.length > 0 ? (
              <List
                dataSource={detail.relatedExceptions}
                renderItem={item => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 0' }}
                    onClick={() => navigateToException(item.id)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={exceptionTypeMap[item.type]?.color} icon={exceptionTypeMap[item.type]?.icon}>
                            {exceptionTypeMap[item.type]?.label}
                          </Tag>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</span>
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')} · {item.assigned_name || '未分配'}
                        </div>
                      }
                    />
                    <Tag color={exceptionStatusMap[item.status]?.color}>
                      {exceptionStatusMap[item.status]?.label}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '30px 0' }}>
                暂无关联异常
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TaxFilingDetail
