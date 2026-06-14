import { useState } from 'react'
import { Table, Tag, Button, Card, Row, Col, Space, Modal, Form, Input, message, Empty } from 'antd'
import type { LoanApplication, RiskData, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'

interface RiskReviewProps {
  applications: LoanApplication[]
  riskData: RiskData[]
  onUpdateStatus: (id: string, status: Status, note: string) => void
}

export function RiskReview({ applications, riskData, onUpdateStatus }: RiskReviewProps) {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [form] = Form.useForm()
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'supplement' | 'return'>('approve')

  const selectedApplication = applications.find(a => a.id === selectedApplicationId)
  const selectedRisk = selectedApplicationId ? riskData.find(r => r.applicationId === selectedApplicationId) : null

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: string) => (
        <a onClick={() => setSelectedApplicationId(text)} style={{ cursor: 'pointer', color: '#1890ff' }}>
          {text}
        </a>
      ),
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text: number) => `¥${text.toLocaleString()}`,
    },
    {
      title: '期限(月)',
      dataIndex: 'term',
      key: 'term',
      width: 100,
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Status) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].label}
        </Tag>
      ),
    },
    {
      title: '风险等级',
      key: 'riskLevel',
      width: 100,
      render: (_: unknown, record: LoanApplication) => {
        const risk = riskData.find(r => r.applicationId === record.id)
        if (!risk) return '-'
        return (
          <Tag color={risk.riskLevel === 'low' ? 'success' : risk.riskLevel === 'medium' ? 'warning' : 'error'}>
            {risk.riskLevel === 'low' ? '低' : risk.riskLevel === 'medium' ? '中' : '高'}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: unknown, record: LoanApplication) => {
        if (record.status === 'pending' || record.status === 'under_review') {
          return (
            <Space>
              <Button size="small" type="primary" onClick={() => handleReview(record.id, 'approve')}>
                通过
              </Button>
              <Button size="small" onClick={() => handleReview(record.id, 'supplement')}>
                补材料
              </Button>
              <Button size="small" onClick={() => handleReview(record.id, 'return')}>
                退回
              </Button>
              <Button size="small" danger onClick={() => handleReview(record.id, 'reject')}>
                拒绝
              </Button>
            </Space>
          )
        }
        return null
      },
    },
  ]

  const handleReview = (id: string, action: 'approve' | 'reject' | 'supplement' | 'return') => {
    setSelectedApplicationId(id)
    setReviewAction(action)
    setShowReviewModal(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const statusMap: Record<string, Status> = {
        approve: 'approved',
        reject: 'rejected',
        supplement: 'supplement',
        return: 'returned',
      }
      if (selectedApplicationId) {
        onUpdateStatus(selectedApplicationId, statusMap[reviewAction], values.note)
        form.resetFields()
        setShowReviewModal(false)
        setSelectedApplicationId(null)
        message.success(`已${reviewAction === 'approve' ? '通过' : reviewAction === 'reject' ? '拒绝' : reviewAction === 'return' ? '退回' : '要求补材料'}`)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 24 }}>风控审核</h2>
      <Row gutter={24}>
        <Col span={15}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={applications}
            pagination={{ pageSize: 10 }}
          />
        </Col>
        <Col span={9}>
          <Card title="审核详情" bordered={false}>
            {selectedApplication && selectedRisk ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4>申请信息</h4>
                  <p>申请人: {selectedApplication.applicantName}</p>
                  <p>身份证: {selectedApplication.idCard.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2')}</p>
                  <p>手机号: {selectedApplication.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                  <p>申请金额: ¥{selectedApplication.amount.toLocaleString()}</p>
                  <p>期限: {selectedApplication.term} 个月</p>
                  <p>用途: {selectedApplication.purpose}</p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>风控数据</h4>
                  <p>信用评分: {selectedRisk.creditScore}</p>
                  <p>收入验证: {selectedRisk.incomeVerification ? '已验证' : '未验证'}</p>
                  <p>资产验证: {selectedRisk.assetVerification ? '已验证' : '未验证'}</p>
                  <p>负债率: {(selectedRisk.debtRatio * 100).toFixed(0)}%</p>
                  <p>风险等级: <Tag color={selectedRisk.riskLevel === 'low' ? 'success' : selectedRisk.riskLevel === 'medium' ? 'warning' : 'error'}>
                    {selectedRisk.riskLevel === 'low' ? '低' : selectedRisk.riskLevel === 'medium' ? '中' : '高'}
                  </Tag></p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>审核备注</h4>
                  <p>{selectedRisk.reviewNote}</p>
                </div>
              </div>
            ) : (
              <Empty description="请选择一条申请查看详情" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={`${reviewAction === 'approve' ? '通过审核' : reviewAction === 'reject' ? '拒绝申请' : reviewAction === 'return' ? '退回申请' : '要求补材料'}`}
        visible={showReviewModal}
        onCancel={() => {
          setShowReviewModal(false)
          setSelectedApplicationId(null)
        }}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="note" label="审核意见" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
