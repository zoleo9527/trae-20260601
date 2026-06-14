import { Card, Row, Col, Table, Tag } from 'antd'
import type { LoanApplication, QuotaSuggestion, CollectionRecord, Status } from '@/types'
import { statusMap } from '@/utils/statusMap'

interface StatisticsProps {
  applications: LoanApplication[]
  quotaSuggestions: QuotaSuggestion[]
  collectionRecords: CollectionRecord[]
}

export function Statistics({ applications, quotaSuggestions, collectionRecords }: StatisticsProps) {
  const totalApplications = applications.length
  const pendingCount = applications.filter(a => a.status === 'pending').length
  const underReviewCount = applications.filter(a => a.status === 'under_review').length
  const approvedCount = applications.filter(a => a.status === 'approved').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length
  const supplementCount = applications.filter(a => a.status === 'supplement').length
  const urgentCount = applications.filter(a => a.status === 'urgent').length

  const totalQuotaAmount = quotaSuggestions.reduce((sum, q) => sum + q.suggestedAmount, 0)
  const approvedQuotaAmount = quotaSuggestions
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + q.suggestedAmount, 0)

  const collectionSuccessRate = collectionRecords.length > 0
    ? ((collectionRecords.filter(c => c.contactResult === 'success').length / collectionRecords.length) * 100).toFixed(1)
    : '0'

  const statusDistribution = [
    { status: 'pending', label: '待处理', count: pendingCount },
    { status: 'under_review', label: '审核中', count: underReviewCount },
    { status: 'approved', label: '已批准', count: approvedCount },
    { status: 'rejected', label: '已拒绝', count: rejectedCount },
    { status: 'supplement', label: '补材料', count: supplementCount },
    { status: 'urgent', label: '有人催', count: urgentCount },
  ]

  const quotaStats = [
    { label: '总建议额度', value: `¥${totalQuotaAmount.toLocaleString()}` },
    { label: '已批准额度', value: `¥${approvedQuotaAmount.toLocaleString()}` },
    { label: '建议数量', value: quotaSuggestions.length },
    { label: '批准率', value: `${((approvedCount / totalApplications) * 100).toFixed(1)}%` },
  ]

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 24 }}>统计分析</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>{totalApplications}</div>
            <div style={{ color: '#999', fontSize: 12 }}>申请总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>{approvedCount}</div>
            <div style={{ color: '#999', fontSize: 12 }}>已批准</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>{supplementCount}</div>
            <div style={{ color: '#999', fontSize: 12 }}>补材料</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>{urgentCount}</div>
            <div style={{ color: '#999', fontSize: 12 }}>有人催</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#722ed1' }}>¥{totalQuotaAmount.toLocaleString()}</div>
            <div style={{ color: '#999', fontSize: 12 }}>总建议额度</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#13c2c2' }}>¥{approvedQuotaAmount.toLocaleString()}</div>
            <div style={{ color: '#999', fontSize: 12 }}>已批准额度</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fa8c16' }}>{quotaSuggestions.length}</div>
            <div style={{ color: '#999', fontSize: 12 }}>建议数量</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#eb2f96' }}>{collectionSuccessRate}%</div>
            <div style={{ color: '#999', fontSize: 12 }}>催收成功率</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="申请状态分布">
            <Table
              rowKey="status"
              columns={[
                { title: '状态', dataIndex: 'label', key: 'label', render: (text: string, record: { status: Status }) => <Tag color={statusMap[record.status].color}>{text}</Tag> },
                { title: '数量', dataIndex: 'count', key: 'count' },
                { 
                  title: '占比', 
                  key: 'percentage', 
                  render: (_, record: { count: number }) => `${((record.count / totalApplications) * 100).toFixed(1)}%` 
                },
              ]}
              dataSource={statusDistribution}
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="额度建议统计">
            <Table
              rowKey="label"
              columns={[
                { title: '指标', dataIndex: 'label', key: 'label' },
                { title: '数值', dataIndex: 'value', key: 'value' },
              ]}
              dataSource={quotaStats}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
