import { Card, Row, Col, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Role } from 'shared';
import { useUserStore, getRoleDefaultUser } from '../store/user';
import { roleMap } from '../utils/constants';

const { Title, Paragraph } = Typography;

const roles: Role[] = ['registrar', 'fieldCoach', 'safetyOfficer'];

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
          <Title level={2} style={{ color: '#fff', margin: 0 }}>🏍️ 摩托车驾培交班系统</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 12 }}>
            报名资料 · 体检核验 · 责任界定 · 交班流转
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {roles.map((role) => {
            const info = roleMap[role];
            const descriptions: Record<Role, string[]> = {
              registrar: [
                '录入学员报名资料',
                '核验证件与照片',
                '标记资料完整性',
                '流转至体检环节',
              ],
              fieldCoach: [
                '承接已完成报名的学员',
                '执行视力、血压、听力等体检',
                '提交体检结果',
                '异常情况标记与流转',
              ],
              safetyOfficer: [
                '复核体检临界案例',
                '异常处理与仲裁',
                '责任归属判定',
                '交班汇总确认',
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
                  bodyStyle={{ padding: 28 }}
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
                      入口
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
          请根据你的岗位选择对应入口 — 各入口的数据和操作权限严格区分
        </div>
      </div>
    </div>
  );
}
