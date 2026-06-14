import { Card, Row, Col, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Role } from 'shared';
import { useUserStore, getRoleDefaultUser } from '../store/user';
import { roleMap } from '../utils/constants';

const { Title, Paragraph } = Typography;

const roles: Role[] = ['purchaseManager', 'appraiser', 'financeSpecialist'];

export default function LoginPage() {
  const navigate = useNavigate();
  const setRole = useUserStore((s) => s.setRole);
  const { message } = App.useApp();

  const onSelect = (role: Role) => {
    setRole(role, getRoleDefaultUser(role));
    message.success(`已进入${roleMap[role].label}入口`);
    navigate(`/${role}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: 1100, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48, color: '#fff' }}>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>🚗 二手车商业务流转系统</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 12 }}>
            成交过户 · 贷款放款 · 催办退回 · 接力处理
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {roles.map((role) => {
            const info = roleMap[role];
            const descriptions: Record<Role, string[]> = {
              purchaseManager: [
                '收车建档与车源档案维护',
                '买卖签约与成交过户办理',
                '催办检测进度，跟进贷款放款',
                '备注信息流转至后续环节',
              ],
              appraiser: [
                '承接待检测车辆',
                '执行外观、发动机、底盘等检测',
                '记录检测结果与整备成本',
                '异常情况退回或要求补材料',
              ],
              financeSpecialist: [
                '承接已过户车辆的贷款申请',
                '审核贷款资料完整性',
                '审批通过后安排放款',
                '查看过户备注作为放款参考',
              ],
            };
            return (
              <Col xs={24} md={8} key={role}>
                <Card
                  hoverable
                  onClick={() => onSelect(role)}
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  styles={{ body: { padding: 28 } }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 48,
                        width: 80,
                        height: 80,
                        lineHeight: '80px',
                        borderRadius: '50%',
                        background: `${info.color}15`,
                        margin: '0 auto 20px',
                      }}
                    >
                      {info.icon}
                    </div>
                    <Title level={4} style={{ margin: '0 0 4px', color: info.color }}>
                      {info.label}
                    </Title>
                    <Paragraph style={{ color: '#8c8c8c', marginBottom: 20 }}>
                      · {getRoleDefaultUser(role)} ·
                    </Paragraph>
                    <div style={{ textAlign: 'left', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      {descriptions[role].map((d, i) => (
                        <div key={i} style={{ fontSize: 13, color: '#595959', padding: '4px 0' }}>
                          ✔️ {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div style={{ textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
          请根据你的岗位选择对应入口 — 收车经理→评估师→金融专员接力处理，成交过户与贷款放款一体化流转
        </div>
      </div>
    </div>
  );
}
