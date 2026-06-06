import React from 'react';
import { Row, Col, Card, Statistic, Tag } from 'antd';
import { 
  ClockCircleOutlined, 
  GiftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { StatsSummary } from '../types';

interface Props {
  stats: StatsSummary;
}

const StatsCards: React.FC<Props> = ({ stats }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic 
            title="待审核" 
            value={stats.pendingReview}
            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic 
            title="赠品配置中" 
            value={stats.giftConfiguring}
            prefix={<GiftOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic 
            title="已完成" 
            value={stats.completed}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic 
            title="已驳回" 
            value={stats.rejected}
            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic 
            title="紧急/特急" 
            value={stats.urgent}
            prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
          {stats.urgent > 0 && (
            <Tag color="red" className="urgent-pulse">需优先处理</Tag>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
