import { Card, Steps, Table, Tag, Descriptions, Alert, Divider } from 'antd';
import { 
  UserAddOutlined, 
  FileTextOutlined, 
  BellOutlined, 
  AlertOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

export const WorkflowDocumentation = () => {
  const rolePermissions = [
    { role: '报名员', actions: ['创建考试批次', '提交考试批次', '处理异常'], icon: '👤' },
    { role: '场地教练', actions: ['确认考试批次', '发送学员通知', '完成通知', '标记缺考', '取消批次', '处理异常'], icon: '🏍️' },
    { role: '安全员', actions: ['确认考试批次', '完成考试', '确认学员通知', '标记缺考', '取消批次', '处理异常'], icon: '🛡️' },
  ];

  const workflowSteps = [
    {
      title: '报名员创建批次',
      description: '报名员创建考试批次，录入考试日期、时间、考场和学员信息',
      icon: <UserAddOutlined />,
      roles: ['报名员'],
    },
    {
      title: '报名员提交批次',
      description: '报名员提交批次，状态变为"已提交"',
      icon: <FileTextOutlined />,
      roles: ['报名员'],
    },
    {
      title: '场地教练/安全员确认',
      description: '场地教练或安全员确认批次，状态变为"已确认"',
      icon: <CheckCircleOutlined />,
      roles: ['场地教练', '安全员'],
    },
    {
      title: '场地教练发送通知',
      description: '场地教练向学员发送考试通知',
      icon: <BellOutlined />,
      roles: ['场地教练'],
    },
    {
      title: '安全员确认通知',
      description: '安全员确认学员收到通知',
      icon: <BellOutlined />,
      roles: ['安全员'],
    },
    {
      title: '标记缺考',
      description: '场地教练或安全员可从待通知或已通知状态标记学员缺考',
      icon: <AlertOutlined />,
      roles: ['场地教练', '安全员'],
    },
    {
      title: '安全员完成考试',
      description: '考试完成后，安全员标记考试完成',
      icon: <CheckCircleOutlined />,
      roles: ['安全员'],
    },
  ];

  const stateTransitions = [
    {
      entity: '考试批次',
      states: [
        { from: '待提交', to: '已提交', action: '提交批次', roles: ['报名员'] },
        { from: '已提交', to: '已确认', action: '确认批次', roles: ['场地教练', '安全员'] },
        { from: '已确认', to: '考试完成', action: '完成考试', roles: ['安全员'] },
        { from: '待提交/已提交', to: '已取消', action: '取消批次', roles: ['场地教练', '安全员'] },
      ],
    },
    {
      entity: '学员通知',
      states: [
        { from: '待通知', to: '已通知', action: '发送通知', roles: ['场地教练'] },
        { from: '待通知', to: '缺考', action: '标记缺考', roles: ['场地教练', '安全员'] },
        { from: '已通知', to: '已确认', action: '确认通知', roles: ['安全员'] },
        { from: '已通知', to: '缺考', action: '标记缺考', roles: ['场地教练', '安全员'] },
        { from: '已确认', to: '已完成', action: '完成通知', roles: ['场地教练'] },
      ],
    },
  ];

  const exceptionTypes = [
    {
      type: '材料缺失',
      description: '学员报名材料不齐全，如缺少体检证明、照片、身份证复印件等',
      color: 'orange',
      icon: '📋',
    },
    {
      type: '超时未处理',
      description: '超过规定时间（48小时）未处理的情况',
      color: 'red',
      icon: '⏰',
    },
    {
      type: '复核不通过',
      description: '学员资格审核未通过，如培训时长不足、理论考试成绩未达标等',
      color: 'purple',
      icon: '❌',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>
          摩托车驾培-考试批次与学员通知 系统说明
        </h1>

        <Alert
          message="系统概述"
          description="本系统用于管理摩托车驾培考试批次和学员通知，处理考试过程中的异常情况。系统严格控制角色权限，确保工作流程的规范性和可追溯性。"
          type="info"
          style={{ marginBottom: '24px' }}
        />

        <Card title="角色权限说明" style={{ marginBottom: '24px' }}>
          <Table 
            dataSource={rolePermissions.map((r, i) => ({ key: i, ...r }))}
            columns={[
              { title: '角色', dataIndex: 'role', key: 'role' },
              { 
                title: '可执行操作', 
                dataIndex: 'actions', 
                key: 'actions',
                render: (actions: string[]) => (
                  <div>
                    {actions.map((action, i) => (
                      <Tag key={i} color="blue" style={{ marginBottom: '4px' }}>{action}</Tag>
                    ))}
                  </div>
                ),
              },
            ]}
            pagination={false}
          />
        </Card>

        <Card title="工作流程步骤" style={{ marginBottom: '24px' }}>
          <Steps 
            current={-1}
            items={workflowSteps.map(step => ({
              title: step.title,
              description: (
                <div>
                  <div>{step.description}</div>
                  <div style={{ marginTop: '8px' }}>
                    角色: 
                    {step.roles.map((role, i) => (
                      <Tag key={i} color="green">{role}</Tag>
                    ))}
                  </div>
                </div>
              ),
              icon: step.icon,
            }))}
          />
        </Card>

        <Card title="状态转换规则" style={{ marginBottom: '24px' }}>
          {stateTransitions.map((transition, i) => (
            <div key={i} style={{ marginBottom: '24px' }}>
              <h3>{transition.entity}</h3>
              <Table 
                dataSource={transition.states.map((s, j) => ({ key: j, ...s }))}
                columns={[
                  { title: '当前状态', dataIndex: 'from', key: 'from' },
                  { 
                    title: '操作', 
                    dataIndex: 'action', 
                    key: 'action',
                    render: (action: string) => <Tag color="blue">{action}</Tag>,
                  },
                  { title: '目标状态', dataIndex: 'to', key: 'to' },
                  { 
                    title: '允许角色', 
                    dataIndex: 'roles', 
                    key: 'roles',
                    render: (roles: string[]) => (
                      <div>
                        {roles.map((role, i) => (
                          <Tag key={i} color="green">{role}</Tag>
                        ))}
                      </div>
                    ),
                  },
                ]}
                pagination={false}
              />
              {i < stateTransitions.length - 1 && <Divider />}
            </div>
          ))}
        </Card>

        <Card title="异常类型说明" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {exceptionTypes.map((exception, i) => (
              <Card key={i} size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{exception.icon}</div>
                  <Tag color={exception.color} style={{ marginBottom: '8px' }}>{exception.type}</Tag>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{exception.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card title="工作流程图">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="批次创建">
              <Tag color="blue">报名员</Tag> 创建考试批次 → <Tag color="gold">待提交</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="批次提交">
              <Tag color="blue">报名员</Tag> 提交批次 → <Tag color="blue">已提交</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="批次确认">
              <Tag color="green">场地教练</Tag> 或 <Tag color="orange">安全员</Tag> 确认 → <Tag color="green">已确认</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发送通知">
              <Tag color="green">场地教练</Tag> 发送通知 → <Tag color="gold">待通知</Tag> → <Tag color="blue">已通知</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="确认通知">
              <Tag color="orange">安全员</Tag> 确认通知 → <Tag color="green">已确认</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="标记缺考">
              <Tag color="green">场地教练</Tag> 或 <Tag color="orange">安全员</Tag> 可从 <Tag color="gold">待通知</Tag> 或 <Tag color="blue">已通知</Tag> 标记为 <Tag color="red">缺考</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="完成考试">
              <Tag color="orange">安全员</Tag> 完成考试 → <Tag color="purple">考试完成</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
};
