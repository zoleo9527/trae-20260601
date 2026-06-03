import React from 'react'
import { Card, Row, Col, Statistic, Tag, Alert } from 'antd'
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  BellOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { LinkageImpact } from '../types'
import { notificationStatusNames } from '../data/mockData'

interface LinkageStatusProps {
  impact: LinkageImpact
  showTitle?: boolean
}

const formatChange = (value: number, suffix: string = '') => {
  if (value > 0) {
    return <span style={{ color: '#f5222d' }}>+{value}{suffix}</span>
  }
  if (value < 0) {
    return <span style={{ color: '#52c41a' }}>{value}{suffix}</span>
  }
  return <span style={{ color: '#8c8c8c' }}>0{suffix}</span>
}

const getNotificationTag = (status: string) => {
  switch (status) {
    case 'acknowledged':
      return <Tag icon={<CheckCircleOutlined />} color="success">{notificationStatusNames[status]}</Tag>
    case 'notified':
      return <Tag icon={<BellOutlined />} color="warning">{notificationStatusNames[status]}</Tag>
    case 'not_notified':
      return <Tag icon={<WarningOutlined />} color="error">{notificationStatusNames[status]}</Tag>
    default:
      return <Tag color="default">{notificationStatusNames[status] || status}</Tag>
  }
}

const LinkageStatus: React.FC<LinkageStatusProps> = ({ impact, showTitle = true }) => {
  return (
    <Card
      title={showTitle ? '联动影响分析' : undefined}
      size="small"
      style={{ marginTop: 16 }}
    >
      {(impact.dishQuantityChange !== 0 || impact.servingSpeedChange !== 0 ||
        impact.waitersChange !== 0 || impact.amountChange !== 0) && (
        <Alert
          message="变更将产生以下联动影响"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title={
              <span>
                <ShoppingCartOutlined style={{ marginRight: 4 }} />
                总菜品数量
              </span>
            }
            value={impact.dishQuantity}
            suffix="份"
            formatter={(value) => (
              <div>
                <div>{value} 份</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {formatChange(impact.dishQuantityChange, '份')}
                </div>
              </div>
            )}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                预计上菜间隔
              </span>
            }
            value={impact.servingSpeed}
            suffix="分钟"
            formatter={(value) => (
              <div>
                <div>{value} 分钟</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {formatChange(impact.servingSpeedChange, '分钟')}
                </div>
              </div>
            )}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={
              <span>
                <TeamOutlined style={{ marginRight: 4 }} />
                需要服务员
              </span>
            }
            value={impact.waitersRequired}
            suffix="人"
            formatter={(value) => (
              <div>
                <div>{value} 人</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {formatChange(impact.waitersChange, '人')}
                </div>
              </div>
            )}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={
              <span>
                <DollarOutlined style={{ marginRight: 4 }} />
                变更后总额
              </span>
            }
            value={impact.totalAmount}
            prefix="¥"
            formatter={(value) => (
              <div>
                <div>¥{Number(value).toLocaleString()}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {formatChange(impact.amountChange, '元')}
                </div>
              </div>
            )}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <span style={{ marginRight: 8 }}>厨房通知状态：</span>
        {getNotificationTag(impact.kitchenNotified)}
      </div>
    </Card>
  )
}

export default LinkageStatus
