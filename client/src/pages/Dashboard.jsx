import React, { useState, useEffect } from 'react'
import { Row, Col, Card, List, Tag, Button, Space, Statistic } from 'antd'
import {
  FileTextOutlined,
  WarningOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import dayjs from 'dayjs'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [exceptionStats, setExceptionStats] = useState(null)
  const [recentExceptions, setRecentExceptions] = useState([])
  const [recentFilings, setRecentFilings] = useState([])

  useEffect(() => {
    api.getStats().then(setStats)
    api.getExceptionStats().then(setExceptionStats)
    api.getExceptions({ pageSize: 5, page: 1 }).then(res => setRecentExceptions(res.list))
    api.getTaxFilings({ pageSize: 5, page: 1 }).then(res => setRecentFilings(res.list))
  }, [])

  const filingStatusMap = {
    pending: { label: '待处理', color: 'default' },
    in_progress: { label: '处理中', color: 'processing' },
    submitted: { label: '已提交', color: 'blue' },
    approved: { label: '审核通过', color: 'success' },
    rejected: { label: '已退回', color: 'error' },
    completed: { label: '已完成', color: 'success' },
  }

  const exceptionTypeMap = {
    urge: { label: '催收', color: 'orange' },
    reject: { label: '退回', color: 'red' },
    supplement: { label: '补材料', color: 'blue' },
  }

  const priorityMap = {
    urgent: { label: '紧急', color: 'red' },
    high: { label: '高', color: 'orange' },
    normal: { label: '普通', color: 'blue' },
    low: { label: '低', color: 'default' },
  }

  const exceptionStatusMap = {
    open: { label: '待处理', color: 'error' },
    processing: { label: '处理中', color: 'processing' },
    resolved: { label: '已解决', color: 'success' },
    closed: { label: '已关闭', color: 'default' },
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={stats?.customerCount || 0}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申报记录数"
              value={stats?.filingCount || 0}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理异常"
              value={exceptionStats?.totalOpen || 0}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="紧急异常"
              value={exceptionStats?.urgentCount || 0}
              prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card
            title="催收提醒"
            size="small"
            extra={<Button type="link" onClick={() => navigate('/exceptions?type=urge')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#fa8c16' }}>
                {exceptionStats?.urgeCount || 0}
              </div>
              <div style={{ color: '#999', marginTop: 8 }}>待处理催收</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="退回异常"
            size="small"
            extra={<Button type="link" onClick={() => navigate('/exceptions?type=reject')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#ff4d4f' }}>
                {exceptionStats?.rejectCount || 0}
              </div>
              <div style={{ color: '#999', marginTop: 8 }}>待处理退回</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="补材料提醒"
            size="small"
            extra={<Button type="link" onClick={() => navigate('/exceptions?type=supplement')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1890ff' }}>
                {exceptionStats?.supplementCount || 0}
              </div>
              <div style={{ color: '#999', marginTop: 8 }}>待补充材料</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="最新异常提醒"
            extra={<Button type="link" onClick={() => navigate('/exceptions')}>更多 <ArrowRightOutlined /></Button>}
          >
            <List
              dataSource={recentExceptions}
              renderItem={item => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/exceptions/${item.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={exceptionTypeMap[item.type]?.color}>
                          {exceptionTypeMap[item.type]?.label}
                        </Tag>
                        <Tag color={priorityMap[item.priority]?.color}>
                          {priorityMap[item.priority]?.label}
                        </Tag>
                        {item.customer_name}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <span>{item.title}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')} · {item.creator_name}
                        </span>
                      </Space>
                    }
                  />
                  <Tag color={exceptionStatusMap[item.status]?.color}>
                    {exceptionStatusMap[item.status]?.label}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="近期申报"
            extra={<Button type="link" onClick={() => navigate('/tax-filings')}>更多 <ArrowRightOutlined /></Button>}
          >
            <List
              dataSource={recentFilings}
              renderItem={item => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tax-filings/${item.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{item.customer_name}</span>
                        <Tag>
                          {item.period}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <span style={{ fontSize: 12 }}>
                          税种：{item.tax_type === 'vat' ? '增值税' : item.tax_type === 'income' ? '企业所得税' : item.tax_type === 'personal_income' ? '个税' : '附加税'}
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          截止日期：{item.due_date}
                        </span>
                      </Space>
                    }
                  />
                  <Tag color={filingStatusMap[item.status]?.color}>
                    {filingStatusMap[item.status]?.label}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
