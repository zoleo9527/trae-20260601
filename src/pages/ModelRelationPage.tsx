import { Card, Table, Tag, Space, Typography, Collapse, Alert } from 'antd';
import { ArrowDownOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export default function ModelRelationPage() {
  const entities = [
    {
      name: 'User (用户)',
      description: '系统用户，包含前台、处理人员、店长三种角色',
      fields: [
        { name: 'id', type: 'string', desc: '用户ID' },
        { name: 'name', type: 'string', desc: '姓名' },
        { name: 'role', type: 'enum', desc: '角色: reception/processor/manager' },
        { name: 'phone', type: 'string', desc: '联系电话' },
      ],
    },
    {
      name: 'CustomerDraft (客户稿件)',
      description: '客户提交的喷绘需求稿件，包含尺寸、材料、颜色等要求',
      fields: [
        { name: 'id', type: 'string', desc: '稿件ID' },
        { name: 'orderNo', type: 'string', desc: '订单编号' },
        { name: 'customerName', type: 'string', desc: '客户名称' },
        { name: 'width/height', type: 'number', desc: '尺寸' },
        { name: 'materialType', type: 'string', desc: '材料类型' },
        { name: 'colorRequirement', type: 'string', desc: '颜色要求' },
        { name: 'status', type: 'enum', desc: '状态: pending_review/approved/rejected/size_issue/color_issue' },
        { name: 'createdBy', type: 'string', desc: '创建人ID → User.id' },
      ],
    },
    {
      name: 'PrintSchedule (喷绘排产)',
      description: '审核通过后的稿件进入排产流程，记录喷绘生产进度',
      fields: [
        { name: 'id', type: 'string', desc: '排产ID' },
        { name: 'scheduleNo', type: 'string', desc: '排产编号' },
        { name: 'draftId', type: 'string', desc: '关联稿件ID → CustomerDraft.id' },
        { name: 'orderNo', type: 'string', desc: '订单编号' },
        { name: 'quantity', type: 'number', desc: '喷绘数量' },
        { name: 'priority', type: 'enum', desc: '优先级: normal/urgent/emergency' },
        {
          name: 'status',
          type: 'enum',
          desc: '状态: draft/submitted/material_confirmed/printing/printed/installing/completed/cancelled',
        },
        { name: 'submittedBy', type: 'string', desc: '提交人ID → User.id' },
      ],
    },
    {
      name: 'MaterialPickup (材料领用)',
      description: '喷绘前的材料领用记录，记录领用材料明细和确认人',
      fields: [
        { name: 'id', type: 'string', desc: '领用ID' },
        { name: 'pickupNo', type: 'string', desc: '领用单号' },
        { name: 'scheduleId', type: 'string', desc: '关联排产ID → PrintSchedule.id' },
        { name: 'items', type: 'array', desc: '材料明细列表' },
        { name: 'totalAmount', type: 'number', desc: '总金额' },
        { name: 'status', type: 'enum', desc: '状态: pending/confirmed/returned' },
        { name: 'pickedBy', type: 'string', desc: '领用人ID → User.id' },
        { name: 'confirmedBy', type: 'string', desc: '确认人ID → User.id' },
      ],
    },
    {
      name: 'InstallationRecord (安装记录)',
      description: '喷绘完成后的安装记录，包含安装时间、人员、照片、客户签字',
      fields: [
        { name: 'id', type: 'string', desc: '安装ID' },
        { name: 'scheduleId', type: 'string', desc: '关联排产ID → PrintSchedule.id' },
        { name: 'scheduledDate', type: 'string', desc: '计划安装日期' },
        { name: 'actualDate', type: 'string', desc: '实际安装日期' },
        { name: 'status', type: 'enum', desc: '状态: scheduled/time_changed/in_progress/completed/failed' },
        { name: 'installers', type: 'array', desc: '安装人员列表' },
        { name: 'photos', type: 'array', desc: '安装照片URL列表' },
        { name: 'customerSigned', type: 'boolean', desc: '客户是否签字确认' },
      ],
    },
    {
      name: 'AuditLog (审计日志)',
      description: '记录所有操作的审计日志，用于追溯和问责',
      fields: [
        { name: 'id', type: 'string', desc: '日志ID' },
        { name: 'entityType', type: 'enum', desc: '实体类型: draft/schedule/material/installation' },
        { name: 'entityId', type: 'string', desc: '关联实体ID' },
        { name: 'action', type: 'enum', desc: '操作类型' },
        { name: 'operatorId', type: 'string', desc: '操作人ID → User.id' },
        { name: 'operatorRole', type: 'enum', desc: '操作人角色' },
        { name: 'timestamp', type: 'string', desc: '操作时间' },
        { name: 'detail', type: 'string', desc: '操作详情' },
        { name: 'oldValues', type: 'object', desc: '变更前的值' },
        { name: 'newValues', type: 'object', desc: '变更后的值' },
      ],
    },
    {
      name: 'ExceptionRecord (异常记录)',
      description: '记录尺寸错误、色差投诉、安装时间变更等异常情况',
      fields: [
        { name: 'id', type: 'string', desc: '异常ID' },
        { name: 'scheduleId', type: 'string', desc: '关联排产ID → PrintSchedule.id' },
        { name: 'type', type: 'enum', desc: '异常类型: size_error/color_complaint/install_time_change/other' },
        { name: 'description', type: 'string', desc: '问题描述' },
        { name: 'status', type: 'enum', desc: '状态: pending/resolved/closed' },
        { name: 'reportedBy', type: 'string', desc: '上报人ID → User.id' },
        { name: 'resolution', type: 'string', desc: '解决方案' },
      ],
    },
  ];

  const roleConstraints = [
    {
      role: '前台 (reception)',
      permissions: [
        '创建客户稿件',
        '提交喷绘排产',
        '变更安装时间',
        '重新提交有问题的稿件',
      ],
      forbidden: ['审核稿件', '确认材料领用', '开始/完成喷绘', '处理异常'],
    },
    {
      role: '处理人员 (processor)',
      permissions: [
        '标记稿件尺寸/颜色问题',
        '登记并确认材料领用',
        '开始/完成喷绘',
        '开始/完成安装',
        '上报色差投诉',
      ],
      forbidden: ['审核稿件', '提交排产', '处理异常'],
    },
    {
      role: '店长 (manager)',
      permissions: [
        '所有前台权限',
        '所有处理人员权限',
        '审核通过/拒绝稿件',
        '取消订单',
        '处理异常记录',
      ],
      forbidden: [],
    },
  ];

  const statusFlow = [
    {
      name: '客户稿件状态流转',
      flow: [
        'pending_review (待审核)',
        '→ approved (已通过) / rejected (已拒绝)',
        '→ size_issue (尺寸问题) / color_issue (颜色问题)',
        '→ pending_review (重新审核)',
      ],
      note: '只有店长可以审核通过或拒绝；处理人员和店长可以标记问题；前台可以重新提交审核',
    },
    {
      name: '喷绘排产状态流转',
      flow: [
        'draft (草稿)',
        '→ submitted (已提交)',
        '→ material_confirmed (材料已确认)',
        '→ printing (喷绘中)',
        '→ printed (喷绘完成)',
        '→ installing (安装中)',
        '→ completed (已完成)',
      ],
      note: '前台/店长提交排产；处理人员/店长确认材料和推进生产；店长可取消订单',
    },
    {
      name: '材料领用状态流转',
      flow: ['pending (待确认)', '→ confirmed (已确认)', '→ returned (已退回)'],
      note: '处理人员/店长确认领用和退回',
    },
    {
      name: '安装状态流转',
      flow: [
        'scheduled (已排期)',
        '→ time_changed (时间已变更) / in_progress (进行中)',
        '→ completed (已完成) / failed (失败)',
        '→ in_progress (重新安装)',
      ],
      note: '前台/店长可变更安装时间；处理人员/店长推进安装流程',
    },
  ];

  return (
    <div>
      <Title level={2}>模型关系与状态约束</Title>

      <Alert
        type="info"
        showIcon
        message="核心设计原则"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>所有状态流转严格按照状态机定义，不允许跨状态操作</li>
            <li>每个操作都有角色权限控制，不允许越权操作</li>
            <li>每一次状态变更都自动记录审计日志，包含操作人、时间、变更前后值</li>
            <li>关键异常（尺寸错误、色差投诉、安装时间变更）自动记录异常表</li>
            <li>交接流程有明确的前后顺序：前台提交 → 处理人员确认材料 → 处理人员喷绘 → 处理人员安装</li>
          </ul>
        }
        style={{ marginBottom: 16 }}
      />

      <Card title="实体关系图 (ER Diagram)" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          <div className="entity-card" style={{ width: 200 }}>
            <h4>CustomerDraft</h4>
            <p style={{ fontSize: 12, color: '#666' }}>客户稿件</p>
            <div style={{ fontSize: 12 }}>
              <Text strong>id</Text><br />
              orderNo<br />
              status<br />
              <Text type="warning">createdBy → User</Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowRightOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
              1:1<br />
              审核通过后
            </div>
          </div>

          <div className="entity-card" style={{ width: 220, borderColor: '#52c41a', background: '#f6ffed' }}>
            <h4 style={{ color: '#52c41a' }}>PrintSchedule</h4>
            <p style={{ fontSize: 12, color: '#666' }}>喷绘排产 (核心)</p>
            <div style={{ fontSize: 12 }}>
              <Text strong>id</Text><br />
              scheduleNo<br />
              status<br />
              <Text type="warning">draftId → CustomerDraft</Text><br />
              <Text type="warning">submittedBy → User</Text>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ArrowDownOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>1:N</div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="entity-card" style={{ width: 180, borderColor: '#faad14', background: '#fffbe6' }}>
              <h4 style={{ color: '#faad14' }}>MaterialPickup</h4>
              <p style={{ fontSize: 12, color: '#666' }}>材料领用</p>
              <div style={{ fontSize: 12 }}>
                <Text strong>id</Text><br />
                status<br />
                <Text type="warning">scheduleId → PrintSchedule</Text>
              </div>
            </div>

            <div className="entity-card" style={{ width: 180, borderColor: '#722ed1', background: '#f9f0ff' }}>
              <h4 style={{ color: '#722ed1' }}>InstallationRecord</h4>
              <p style={{ fontSize: 12, color: '#666' }}>安装记录</p>
              <div style={{ fontSize: 12 }}>
                <Text strong>id</Text><br />
                status<br />
                <Text type="warning">scheduleId → PrintSchedule</Text>
              </div>
            </div>

            <div className="entity-card" style={{ width: 180, borderColor: '#f5222d', background: '#fff1f0' }}>
              <h4 style={{ color: '#f5222d' }}>ExceptionRecord</h4>
              <p style={{ fontSize: 12, color: '#666' }}>异常记录</p>
              <div style={{ fontSize: 12 }}>
                <Text strong>id</Text><br />
                type (尺寸/色差/时间)<br />
                <Text type="warning">scheduleId → PrintSchedule</Text>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div className="entity-card" style={{ width: 400, margin: '0 auto', borderColor: '#13c2c2', background: '#e6fffb' }}>
            <h4 style={{ color: '#13c2c2' }}>AuditLog (审计日志)</h4>
            <p style={{ fontSize: 12, color: '#666' }}>记录所有实体的所有操作 · 不可删除 · 不可修改</p>
            <div style={{ fontSize: 12 }}>
              entityType + entityId → 关联任意实体 · operatorId → User · 记录变更前后值
            </div>
          </div>
        </div>
      </Card>

      <Card title="角色权限约束" style={{ marginBottom: 16 }}>
        <Table
          dataSource={roleConstraints}
          rowKey="role"
          pagination={false}
          columns={[
            { title: '角色', dataIndex: 'role', key: 'role', width: 150 },
            {
              title: '允许的操作',
              dataIndex: 'permissions',
              key: 'permissions',
              render: (perms: string[]) => (
                <Space wrap>
                  {perms.map((p: string, idx: number) => (
                    <Tag key={idx} color="green">{p}</Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: '禁止的操作',
              dataIndex: 'forbidden',
              key: 'forbidden',
              render: (items: string[]) => items.length > 0 ? (
                <Space wrap>
                  {items.map((p: string, idx: number) => (
                    <Tag key={idx} color="red">{p}</Tag>
                  ))}
                </Space>
              ) : <span style={{ color: '#999' }}>无限制</span>,
            },
          ]}
        />
      </Card>

      <Card title="状态流转约束">
        <Collapse defaultActiveKey={['0', '1', '2', '3']}>
          {statusFlow.map((flow, idx) => (
            <Panel header={flow.name} key={idx}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>状态流转: </Text>
                  {flow.flow.map((step, stepIdx) => (
                    <span key={stepIdx}>
                      {stepIdx > 0 && <ArrowRightOutlined style={{ color: '#999', margin: '0 8px' }} />}
                      <Tag color={step.includes('→') ? 'default' : 'blue'}>{step.replace('→ ', '')}</Tag>
                    </span>
                  ))}
                </div>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  <Text strong>说明: </Text>{flow.note}
                </Paragraph>
              </Space>
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Card title="实体详细定义" style={{ marginTop: 16 }}>
        <Collapse>
          {entities.map((entity, idx) => (
            <Panel header={`${entity.name} - ${entity.description}`} key={idx}>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong>描述: </Text>{entity.description}
              </Paragraph>
              <Table
                dataSource={entity.fields}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  { title: '字段名', dataIndex: 'name', key: 'name', width: 150 },
                  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
                  { title: '说明', dataIndex: 'desc', key: 'desc' },
                ]}
              />
            </Panel>
          ))}
        </Collapse>
      </Card>
    </div>
  );
}
