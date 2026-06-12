import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Button, Timeline, Descriptions } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { pregnancyTests as initialTests, statusMap, resultMap } from '../data/mockData'

function PregnancyTestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tests] = useState(initialTests)
  const { currentUser, hasPermission } = useAuth()
  
  const test = tests.find(t => t.id === id)

  if (!test) {
    return <div>妊检记录不存在</div>
  }

  const handleApprove = () => {
    console.log('批准妊检结果:', test.id)
  }

  const handleReject = () => {
    console.log('驳回妊检结果:', test.id)
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
        返回列表
      </Button>

      <Card title={`妊检详情 - ${test.id}`} style={{ marginBottom: '16px' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="猪只编号">{test.pigId}</Descriptions.Item>
          <Descriptions.Item label="耳号">{test.sowNumber}</Descriptions.Item>
          <Descriptions.Item label="胎次">{test.parity}</Descriptions.Item>
          <Descriptions.Item label="检测日期">{test.testDate}</Descriptions.Item>
          <Descriptions.Item label="检测方法">{test.testMethod}</Descriptions.Item>
          <Descriptions.Item label="检测结果">
            <Tag color={resultMap[test.result]?.color}>{resultMap[test.result]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="预产期">{test.expectedFarrowingDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="检测人">{test.handler}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={statusMap[test.status]?.color}>{statusMap[test.status]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{test.createdAt}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{test.updatedAt}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{test.remarks}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          {hasPermission('pregnancyTest', 'approve') && test.status === 'pending' && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>批准</Button>
          )}
          {hasPermission('pregnancyTest', 'reject') && test.status !== 'rejected' && (
            <Button danger icon={<CloseOutlined />} onClick={handleReject}>驳回</Button>
          )}
        </div>
      </Card>

      <Card title="操作历史">
        <Timeline>
          {test.history.map((item, index) => (
            <Timeline.Item key={index}>
              <div>
                <strong>{item.action}</strong>
                <span style={{ marginLeft: '16px', color: '#666' }}>{item.time}</span>
              </div>
              <div style={{ marginTop: '8px', color: '#888' }}>
                操作人：{item.operator}
              </div>
              <div style={{ marginTop: '4px', color: '#888' }}>
                备注：{item.remark}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  )
}

export default PregnancyTestDetail