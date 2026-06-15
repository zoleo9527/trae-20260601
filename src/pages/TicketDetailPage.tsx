import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Space,
  Timeline,
  Card,
  List,
  Row,
  Col,
  Button,
  Typography,
  Table,
  Empty,
  Divider,
  Result,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  SolutionOutlined,
  SettingOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { TicketService } from '../services/TicketService';
import { StatusLabel, StatusColor, RoleLabel } from '../types';
import type { ServiceTicket } from '../types';

const { Title, Paragraph, Text } = Typography;

export default function TicketDetailPage({ onUpdated }: { onUpdated: () => void }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticket: ServiceTicket | undefined = id ? TicketService.getTicket(id) : undefined;

  if (!ticket) {
    return (
      <Result status="404" title="未找到工单" subTitle="工单号或ID不存在">
        <Button onClick={() => navigate(-1)}>返回</Button>
      </Result>
    );
  }

  const partCols = [
    { title: '配件名称', dataIndex: 'name', key: 'name' },
    { title: '料号/SKU', dataIndex: 'sku', key: 'sku', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '申请原因', dataIndex: 'reason', key: 'reason' },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回列表
        </Button>
      </div>

      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              工单 {ticket.ticketNo}
              <Tag color={StatusColor[ticket.status] as any} style={{ marginLeft: 12 }}>
                {StatusLabel[ticket.status]}
              </Tag>
            </Title>
            <Text type="secondary">
              创建于 {ticket.createdAt} · 来源：{ticket.source} · 当前处理：
              <Tag color="blue">{RoleLabel[ticket.currentHandler]}</Tag>
            </Text>
          </div>
          <Space>
            {ticket.handlers.customer_service && (
              <Tag icon={<UserOutlined />}>客服：{ticket.handlers.customer_service}</Tag>
            )}
            {ticket.handlers.engineer && (
              <Tag icon={<SolutionOutlined />} color="orange">
                工程师：{ticket.handlers.engineer}
              </Tag>
            )}
            {ticket.handlers.parts_admin && (
              <Tag icon={<SettingOutlined />} color="purple">
                配件：{ticket.handlers.parts_admin}
              </Tag>
            )}
          </Space>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="客户与家电信息" size="small">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="客户姓名">{ticket.customer.name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{ticket.customer.phone}</Descriptions.Item>
              <Descriptions.Item label="服务地址">{ticket.customer.address}</Descriptions.Item>
              <Descriptions.Item label="家电类型">{ticket.appliance.type}</Descriptions.Item>
              <Descriptions.Item label="品牌型号">
                {ticket.appliance.brand} {ticket.appliance.model}
              </Descriptions.Item>
              <Descriptions.Item label="购买日期">
                {ticket.appliance.purchaseDate}
                <Tag color={ticket.appliance.warranty ? 'green' : 'default'} style={{ marginLeft: 8 }}>
                  {ticket.appliance.warranty ? '保修期内' : '已过保'}
                </Tag>
              </Descriptions.Item>
              {ticket.appliance.serialNo && (
                <Descriptions.Item label="序列号">{ticket.appliance.serialNo}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="报修描述" size="small" extra={<Text type="secondary">受理人：{ticket.createdBy}</Text>}>
            <Paragraph type="secondary" style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {ticket.complaintDescription}
            </Paragraph>
            {ticket.finalReport && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text strong>完工报告：</Text>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {ticket.finalReport}
                  </Paragraph>
                  <Text type="secondary">完成时间：{ticket.completedAt}</Text>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {ticket.diagnosis && (
        <Card
          title={
            <Space>
              <SolutionOutlined />
              故障诊断结果
              {ticket.diagnosis.needParts ? (
                <Tag color="orange">需申请配件</Tag>
              ) : (
                <Tag color="cyan">无需配件</Tag>
              )}
            </Space>
          }
          size="small"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="故障现象">
                  <Space wrap>
                    {ticket.diagnosis.symptoms.map((s, i) => (
                      <Tag key={i}>{s}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="故障代码">
                  {ticket.diagnosis.faultCode || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="故障描述">
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {ticket.diagnosis.faultDescription}
                  </Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="处理方案">
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {ticket.diagnosis.solution}
                  </Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="预计工时 / 人工费">
                  {ticket.diagnosis.estimateMinutes || '-'} 分钟 /{' '}
                  <Text strong>¥{ticket.diagnosis.laborFee || 0}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="诊断备注（将传递给配件申请）">
                  <Text type="warning">{ticket.diagnosis.remark || '(无)'}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      )}

      {ticket.partsApplications.length > 0 && (
        <Card
          title={
            <Space>
              <SettingOutlined />
              配件申请回看（共 {ticket.partsApplications.length} 条）
            </Space>
          }
          size="small"
        >
          <List
            dataSource={ticket.partsApplications}
            renderItem={(app) => (
              <List.Item style={{ alignItems: 'flex-start', padding: '12px 0' }}>
                <Card
                  size="small"
                  style={{ width: '100%' }}
                  title={
                    <Space>
                      申请 #{app.id.slice(0, 8)}
                      <Tag
                        color={
                          app.status === 'approved'
                            ? 'green'
                            : app.status === 'rejected'
                            ? 'red'
                            : 'warning'
                        }
                      >
                        {app.status === 'approved'
                          ? '已批准'
                          : app.status === 'rejected'
                          ? '已驳回'
                          : '待审核'}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {app.appliedBy} 提交于 {app.appliedAt}
                      </Text>
                      {app.reviewBy && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          · {app.reviewBy} 审核于 {app.reviewAt}
                        </Text>
                      )}
                    </Space>
                  }
                  extra={
                    app.reviewRemark ? (
                      <Tag color={app.status === 'approved' ? 'green' : 'red'}>
                        审核意见：{app.reviewRemark}
                      </Tag>
                    ) : null
                  }
                >
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      【诊断备注携带入申请】：
                    </Text>
                    <Text type="warning" style={{ fontSize: 12 }}>
                      {app.diagnosisRemarkCarried || '(无)'}
                    </Text>
                  </div>
                  <Table
                    size="small"
                    columns={partCols}
                    dataSource={app.items}
                    rowKey="id"
                    pagination={false}
                  />
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={16}>
        <Col span={14}>
          <Card title={<Space><Timeline />状态时间线</Space>} size="small">
            <Timeline
              mode="left"
              items={[...ticket.timeline].reverse().map((t) => ({
                color:
                  t.status === 'completed'
                    ? 'green'
                    : t.status === 'parts_rejected'
                    ? 'red'
                    : t.status === 'diagnosed_need_parts' || t.status === 'parts_applying'
                    ? 'orange'
                    : 'blue',
                label: t.occurredAt,
                children: (
                  <div>
                    <Space>
                      <Tag color={StatusColor[t.status] as any}>{StatusLabel[t.status]}</Tag>
                      <Text strong>
                        {RoleLabel[t.operatorRole]} · {t.operator}
                      </Text>
                    </Space>
                    {t.remark && (
                      <div style={{ marginTop: 4, color: '#555', fontSize: 13 }}>{t.remark}</div>
                    )}
                    {t.fromStatus && (
                      <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                        由 {StatusLabel[t.fromStatus]} 流转而来
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title={<Space><MessageOutlined />沟通记录</Space>} size="small">
            {ticket.communications.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={ticket.communications}
                renderItem={(c) => (
                  <List.Item style={{ alignItems: 'flex-start' }}>
                    <List.Item.Meta
                      avatar={<UserOutlined />}
                      title={
                        <Space>
                          <Tag color={c.role === 'customer_service' ? 'blue' : c.role === 'engineer' ? 'orange' : 'purple'}>
                            {RoleLabel[c.role]}
                          </Tag>
                          <Text strong>{c.person}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {c.createdAt}
                          </Text>
                        </Space>
                      }
                      description={<span style={{ whiteSpace: 'pre-wrap' }}>{c.content}</span>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: 0 }} />
    </Space>
  );
}
