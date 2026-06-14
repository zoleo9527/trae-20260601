import { Card, Row, Col, Tag, Progress, Alert, Table } from 'antd';
import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useStore } from '../store';

export default function Dashboard() {
  const { programs, attendances, students, rehearsals, userRole } = useStore();

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalPrograms = programs.length;
    const completedRehearsals = rehearsals.filter((r) => r.status === 'completed').length;
    const pendingRehearsals = rehearsals.filter((r) => r.status === 'pending').length;
    
    const absentStudents = attendances.filter((a) => !a.present).length;
    const absentAttendances = attendances.filter((a) => !a.present);
    const makeupCompleted = absentAttendances.filter((a) => a.makeupCompleted).length;
    const makeupPending = absentAttendances.filter((a) => !a.makeupCompleted).length;
    
    const noCostume = attendances.filter((a) => !a.costumeCollected).length;
    const noParentConfirm = attendances.filter((a) => !a.parentConfirmed).length;
    
    const avgCompletion = attendances.length > 0 
      ? Math.round(attendances.reduce((sum, a) => sum + a.actionCompletion, 0) / attendances.length)
      : 0;

    return {
      totalStudents,
      totalPrograms,
      completedRehearsals,
      pendingRehearsals,
      absentStudents,
      makeupCompleted,
      makeupPending,
      noCostume,
      noParentConfirm,
      avgCompletion,
    };
  }, [students, programs, rehearsals, attendances]);

  const highRiskPrograms = programs.filter((p) => p.riskLevel === 'high');
  const mediumRiskPrograms = programs.filter((p) => p.riskLevel === 'medium');

  const columns = [
    { title: '节目名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', render: (text: string) => (
      <Tag color={text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
        {text === 'high' ? '高风险' : text === 'medium' ? '中风险' : '低风险'}
      </Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (text: string) => (
      text === 'ready' ? <Tag color="green">准备就绪</Tag> : 
      text === 'rehearsing' ? <Tag color="blue">排练中</Tag> : 
      <Tag color="yellow">筹备中</Tag>
    )},
    { title: '备注', dataIndex: 'notes', key: 'notes' },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalStudents}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>学生总数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalPrograms}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>演出节目</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.completedRehearsals}/{rehearsals.length}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>排练进度</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOutlined style={{ color: '#f5222d', fontSize: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.absentStudents}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>缺勤人数</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="整体动作完成度">
            <Progress percent={stats.avgCompletion} strokeColor={{ '0%': '#10b981', '100%': '#3b82f6' }} />
            <div style={{ marginTop: '16px', textAlign: 'center', color: '#666' }}>
              平均动作完成度: {stats.avgCompletion}%
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="补训完成情况">
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>{stats.makeupCompleted}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>已完成</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16' }}>{stats.makeupPending}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>待完成</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {(userRole === 'admin' || userRole === 'principal') && (
        <Card title="风险预警" style={{ marginBottom: '24px' }}>
          {(stats.noCostume > 0 || stats.noParentConfirm > 0) && (
            <Alert
              message="待处理事项"
              description={
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {stats.noCostume > 0 && <li>{stats.noCostume} 名学生未领取服装</li>}
                  {stats.noParentConfirm > 0 && <li>{stats.noParentConfirm} 名学生家长未确认</li>}
                </ul>
              }
              type="warning"
              showIcon
            />
          )}
          {(stats.noCostume === 0 && stats.noParentConfirm === 0) && (
            <Alert
              message="所有事项已处理完毕"
              type="success"
              showIcon
            />
          )}
        </Card>
      )}

      {(userRole === 'principal' || userRole === 'admin') && (
        <Card title="节目风险监控">
          {highRiskPrograms.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#f5222d', marginBottom: '8px' }}>高风险节目 ({highRiskPrograms.length})</h4>
              <Table
                columns={columns}
                dataSource={highRiskPrograms}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          )}
          {mediumRiskPrograms.length > 0 && (
            <div>
              <h4 style={{ color: '#fa8c16', marginBottom: '8px' }}>中风险节目 ({mediumRiskPrograms.length})</h4>
              <Table
                columns={columns}
                dataSource={mediumRiskPrograms}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          )}
        </Card>
      )}

      {userRole === 'teacher' && (
        <Card title="学生动作完成度统计">
          <Table
            columns={[
              { title: '学生姓名', dataIndex: 'name', key: 'name' },
              { 
                title: '平均完成度', 
                key: 'completion', 
                render: (_, student) => {
                  const studentAttendances = attendances.filter((a) => a.studentId === student.id);
                  const avg = studentAttendances.length > 0
                    ? Math.round(studentAttendances.reduce((sum, a) => sum + a.actionCompletion, 0) / studentAttendances.length)
                    : 0;
                  return (
                    <div>
                      <Progress percent={avg} size="small" strokeColor={avg >= 80 ? '#52c41a' : avg >= 60 ? '#fa8c16' : '#f5222d'} />
                      <span style={{ marginLeft: '8px' }}>{avg}%</span>
                    </div>
                  );
                }
              },
              { 
                title: '缺勤次数', 
                key: 'absentCount', 
                render: (_, student) => {
                  const count = attendances.filter((a) => a.studentId === student.id && !a.present).length;
                  return <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>;
                }
              },
            ]}
            dataSource={students}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
}
