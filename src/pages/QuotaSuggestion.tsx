import { useState } from 'react'
import { Table, Tag, Button, Card, Row, Col, Space, Modal, Form, Input, InputNumber, message, Empty } from 'antd'
import type { QuotaSuggestion, LoanApplication, RiskData, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'

interface QuotaSuggestionProps {
  quotaSuggestions: QuotaSuggestion[]
  applications: LoanApplication[]
  riskData: RiskData[]
  onUpdateQuota: (id: string, status: Status) => void
}

export function QuotaSuggestion({ quotaSuggestions, applications, riskData, onUpdateQuota }: QuotaSuggestionProps) {
  const [selectedQuotaId, setSelectedQuotaId] = useState<string | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)

  const selectedQuota = quotaSuggestions.find(q => q.id === selectedQuotaId)
  const selectedApplication = selectedQuota ? applications.find(a => a.id === selectedQuota!.applicationId) : null
  const selectedRisk = selectedQuota ? riskData.find(r => r.applicationId === selectedQuota!.applicationId) : null

  const columns = [
    {
      title: '建议编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: string) => (
        <a onClick={() => setSelectedQuotaId(text)} style={{ cursor: 'pointer', color: '#1890ff' }}>
          {text}
        </a>
      ),
    },
    {
      title: '申请编号',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 120,
      render: (text: string) => {
        const app = applications.find(a => a.id === text)
        return app ? `${text} (${app.applicantName})` : text
      },
    },
    {
      title: '建议额度',
      dataIndex: 'suggestedAmount',
      key: 'suggestedAmount',
      width: 120,
      render: (text: number) => text > 0 ? `¥${text.toLocaleString()}` : '-',
    },
    {
      title: '建议利率',
      dataIndex: 'suggestedRate',
      key: 'suggestedRate',
      width: 100,
      render: (text: number) => text > 0 ? `${(text * 100).toFixed(2)}%` : '-',
    },
    {
      title: '建议期限',
      dataIndex: 'suggestedTerm',
      key: 'suggestedTerm',
      width: 100,
      render: (text: number) => text > 0 ? `${text} 月` : '-',
    },
    {
      title: '建议人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
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
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: QuotaSuggestion) => {
        if (record.status === 'under_review') {
          return (
            <Space>
              <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>
                批准
              </Button>
              <Button size="small" danger onClick={() => handleReject(record.id)}>
                拒绝
              </Button>
            </Space>
          )
        }
        return null
      },
    },
  ]

  const handleApprove = (id: string) => {
    setSelectedQuotaId(id)
    setShowApproveModal(true)
  }

  const handleReject = (id: string) => {
    Modal.confirm({
      title: '拒绝额度建议',
      content: '确定要拒绝此额度建议吗？',
      onOk: () => {
        onUpdateQuota(id, 'rejected')
        message.success('已拒绝')
      },
    })
  }

  const handleConfirmApprove = () => {
    if (selectedQuotaId) {
      onUpdateQuota(selectedQuotaId, 'approved')
      setShowApproveModal(false)
      setSelectedQuotaId(null)
      message.success('已批准')
    }
  }

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 24 }}>额度建议</h2>
      <Row gutter={24}>
        <Col span={15}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={quotaSuggestions}
            pagination={{ pageSize: 10 }}
          />
        </Col>
        <Col span={9}>
          <Card title="额度建议详情" bordered={false}>
            {selectedQuota && selectedApplication ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4>申请信息</h4>
                  <p>申请人: {selectedApplication.applicantName}</p>
                  <p>申请金额: ¥{selectedApplication.amount.toLocaleString()}</p>
                  <p>申请期限: {selectedApplication.term} 个月</p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>额度建议</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>建议额度:</span>
                    <span style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                      ¥{selectedQuota.suggestedAmount.toLocaleString()}
                    </span>
                  </div>
                  <p>建议利率: {(selectedQuota.suggestedRate * 100).toFixed(2)}%</p>
                  <p>建议期限: {selectedQuota.suggestedTerm} 个月</p>
                </div>
                {selectedRisk && (
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                    <h4>风控依据</h4>
                    <p>信用评分: {selectedRisk.creditScore}</p>
                    <p>负债率: {(selectedRisk.debtRatio * 100).toFixed(0)}%</p>
                    <p>风险等级: <Tag color={selectedRisk.riskLevel === 'low' ? 'success' : selectedRisk.riskLevel === 'medium' ? 'warning' : 'error'}>
                      {selectedRisk.riskLevel === 'low' ? '低' : selectedRisk.riskLevel === 'medium' ? '中' : '高'}
                    </Tag></p>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>建议理由</h4>
                  <p>{selectedQuota.reason}</p>
                </div>
              </div>
            ) : (
              <Empty description="请选择一条额度建议查看详情" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="批准额度建议"
        visible={showApproveModal}
        onCancel={() => {
          setShowApproveModal(false)
          setSelectedQuotaId(null)
        }}
        onOk={handleConfirmApprove}
      >
        {selectedQuota && (
          <div>
            <p>确认批准以下额度建议：</p>
            <p>建议编号: {selectedQuota.id}</p>
            <p>建议额度: ¥{selectedQuota.suggestedAmount.toLocaleString()}</p>
            <p>建议利率: {(selectedQuota.suggestedRate * 100).toFixed(2)}%</p>
            <p>建议期限: {selectedQuota.suggestedTerm} 个月</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
