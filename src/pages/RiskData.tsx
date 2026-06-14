import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Progress, Empty } from 'antd'
import type { RiskData, LoanApplication } from '@/types'

interface RiskDataProps {
  riskData: RiskData[]
  applications: LoanApplication[]
}

export function RiskData({ riskData, applications }: RiskDataProps) {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const selectedRisk = riskData.find(r => r.applicationId === selectedApplicationId)
  const selectedApplication = applications.find(a => a.id === selectedApplicationId)

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 120,
      render: (text: string) => (
        <a onClick={() => setSelectedApplicationId(text)} style={{ cursor: 'pointer', color: '#1890ff' }}>
          {text}
        </a>
      ),
    },
    {
      title: '信用评分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      width: 120,
      render: (text: number) => (
        <div>
          <span>{text}</span>
          <Progress percent={Math.min(text, 100)} size="small" status={text >= 700 ? 'success' : text >= 600 ? 'warning' : 'error'} />
        </div>
      ),
    },
    {
      title: '收入验证',
      dataIndex: 'incomeVerification',
      key: 'incomeVerification',
      width: 100,
      render: (text: boolean) => (
        <Tag color={text ? 'success' : 'error'}>
          {text ? '已验证' : '未验证'}
        </Tag>
      ),
    },
    {
      title: '资产验证',
      dataIndex: 'assetVerification',
      key: 'assetVerification',
      width: 100,
      render: (text: boolean) => (
        <Tag color={text ? 'success' : 'error'}>
          {text ? '已验证' : '未验证'}
        </Tag>
      ),
    },
    {
      title: '负债率',
      dataIndex: 'debtRatio',
      key: 'debtRatio',
      width: 100,
      render: (text: number) => `${(text * 100).toFixed(0)}%`,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (text: string) => (
        <Tag color={text === 'low' ? 'success' : text === 'medium' ? 'warning' : 'error'}>
          {text === 'low' ? '低' : text === 'medium' ? '中' : '高'}
        </Tag>
      ),
    },
    {
      title: '审核备注',
      dataIndex: 'reviewNote',
      key: 'reviewNote',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
  ]

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 24 }}>风控资料</h2>
      <Row gutter={24}>
        <Col span={15}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={riskData}
            pagination={{ pageSize: 10 }}
          />
        </Col>
        <Col span={9}>
          <Card title="详情" bordered={false}>
            {selectedRisk && selectedApplication ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4>申请信息</h4>
                  <p>申请人: {selectedApplication.applicantName}</p>
                  <p>申请金额: ¥{selectedApplication.amount.toLocaleString()}</p>
                  <p>期限: {selectedApplication.term} 个月</p>
                  <p>用途: {selectedApplication.purpose}</p>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <h4>风控数据</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>信用评分:</span>
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: selectedRisk.creditScore >= 700 ? '#52c41a' : selectedRisk.creditScore >= 600 ? '#faad14' : '#ff4d4f' }}>
                      {selectedRisk.creditScore}
                    </span>
                  </div>
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
              <Empty description="请选择一条记录查看详情" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
