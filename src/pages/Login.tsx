import { Card, Typography, Space, Button, Row, Col } from 'antd';
import { ROLE_LABELS } from '../types';
import type { UserRole } from '../types';

const { Title, Paragraph } = Typography;

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

const roles: { role: UserRole; name: string; avatar: string; description: string; color: string }[] = [
  { role: 'receptionist', name: '张接单', avatar: '👩', description: '接单录入、问题标记、批量处理', color: '#1890ff' },
  { role: 'designer', name: '李设计', avatar: '👨‍🎨', description: '设计改稿、尺寸/色差处理、历史备注', color: '#722ed1' },
  { role: 'installer', name: '王队长', avatar: '👷', description: '安装照片、时间变更、现场问题反馈', color: '#13c2c2' },
  { role: 'production', name: '赵喷绘', avatar: '👨‍🔧', description: '喷绘生产、质量跟踪', color: '#fa8c16' },
  { role: 'quality', name: '质检刘', avatar: '🔍', description: '质量检查、问题上报', color: '#52c41a' },
  { role: 'admin', name: '管理员', avatar: '👨‍💼', description: '全局查看、数据管理', color: '#f5222d' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 900,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          borderRadius: 16
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              🏭 广告喷绘店管理系统
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16 }}>
              设计改稿与客户确认 · 现场压力监控
            </Paragraph>
          </div>

          <div style={{ background: '#fff7e6', padding: 12, borderRadius: 8, textAlign: 'left' }}>
            <Paragraph style={{ margin: 0, color: '#d48806', fontSize: 13 }}>
              <strong>💡 演示提示：</strong>选择不同角色进入系统，体验不同岗位的处理入口。
              建议从 <strong>AD260615-1001</strong>（美味连锁餐饮）开始，这是一个典型的色差+尺寸问题订单，
              可以完整走通<strong>「设计师改稿→客户确认→喷绘→安装→完成」</strong>全流程。
            </Paragraph>
          </div>

          <Title level={4} style={{ margin: '16px 0 0' }}>选择角色登录</Title>
          
          <Row gutter={[16, 16]}>
            {roles.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.role}>
                <Card
                  hoverable
                  onClick={() => onLogin(item.role)}
                  style={{ 
                    textAlign: 'center',
                    border: `2px solid ${item.color}20`,
                    transition: 'all 0.3s'
                  }}
                  bodyStyle={{ padding: '24px 16px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px ${item.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    fontSize: 48, 
                    marginBottom: 12,
                    display: 'inline-block',
                    padding: 16,
                    background: `${item.color}15`,
                    borderRadius: '50%'
                  }}>
                    {item.avatar}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    {item.name}
                  </div>
                  <div style={{ color: item.color, fontSize: 13, marginBottom: 8 }}>
                    {ROLE_LABELS[item.role]}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, lineHeight: 1.5 }}>
                    {item.description}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>
    </div>
  );
}
