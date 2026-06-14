import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Empty, DatePicker } from 'antd'
import type { QuotaSuggestion, LoanApplication, RiskData, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'
import dayjs from 'dayjs'

interface QuotaReviewProps {
  quotaSuggestions: QuotaSuggestion[]
  applications: LoanApplication[]
  riskData: RiskData[]
}

export function QuotaReview({ quotaSuggestions, applications, riskData }: QuotaReviewProps) {
  const [selectedQuotaId, setSelectedQuotaId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const selectedQuota = quotaSuggestions.find(q => q.id === selectedQuotaId)
  const selectedApplication = selectedQuota ? applications.find(a => a.id === selectedQuota!.applicationId) : null
  const selectedRisk = selectedQuota ? riskData.find(r => r.applicationId === selectedQuota!.applicationId) : null

  const filteredSuggestions = dateRange
    ? quotaSuggestions.filter(q => {
        const reviewDate = dayjs(q.reviewTime)
        return reviewDate.isBetween(dateRange[0], dateRange[1], null, '[]')
      })
    : quotaSuggestions

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
      title: '审核时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 160,
    },
  ]

  const totalAmount = filteredSuggestions.reduce((sum, q) => sum + q.suggestedAmount, 0)
  const approvedCount = filteredSuggestions.filter(q => q.status === 'approved').length
  const completedCount = filteredSuggestions.filter(q => q.status === 'completed').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>额度建议回看</h2>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          style={{ width: 300 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card style={{ width: 200 }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
            ¥{totalAmount.toLocaleString()}
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>总建议额度</div>
        </Card>
        <Card style={{ width: 200 }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
            {approvedCount}
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>已批准</div>
        </Card>
        <Card style={{ width: 200 }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
            {completedCount}
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>已完成</div>
        </Card>
      </div>

      <Row gutter={24}>
        <Col span={15}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredSuggestions}
            pagination={{ pageSize: 10 }}
          />
        </Col>
        <Col span={9}>
          <Card title="详情" bordered={false}>
            {selectedQuota && selectedApplication ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4>申请信息</h4>
                  <p>申请人: {selectedApplication.applicantName}</p>
                  <p>申请金额: ¥{selectedApplication.amount.toLocaleString()}</p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>额度建议</h4>
                  <p>建议额度: ¥{selectedQuota.suggestedAmount.toLocaleString()}</p>
                  <p>建议利率: {(selectedQuota.suggestedRate * 100).toFixed(2)}%</p>
                  <p>建议期限: {selectedQuota.suggestedTerm} 个月</p>
                </div>
                {selectedRisk && (
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                    <h4>风控依据</h4>
                    <p>信用评分: {selectedRisk.creditScore}</p>
                    <p>负债率: {(selectedRisk.debtRatio * 100).toFixed(0)}%</p>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>建议理由</h4>
                  <p>{selectedQuota.reason}</p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>建议人/时间</h4>
                  <p>{selectedQuota.reviewer} / {selectedQuota.reviewTime}</p>
                </div>
              </div>
            ) : (
              <Empty description="请选择一条记录查看详情" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
