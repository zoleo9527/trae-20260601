import { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Timeline,
  Empty,
  message,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Divider,
  Alert,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { projectsApi, arrangementsApi, signinApi, exceptionsApi, expertsApi } from '@/services/api';
import {
  Project,
  ProjectArrangement,
  ExpertSigninRecord,
  ExceptionRecord,
  BlockAnalysis,
  SigninAnalysis,
  ResponsibilityMatrix,
  TimelineEvent,
  statusDisplay,
  arrangementStatusDisplay,
  signinStatusDisplay,
  exceptionTypeDisplay,
  exceptionStatusDisplay,
  exceptionSeverityDisplay,
  roleNames,
} from '@/types';

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [arrangement, setArrangement] = useState<ProjectArrangement | null>(null);
  const [signinRecords, setSigninRecords] = useState<ExpertSigninRecord[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [blockAnalysis, setBlockAnalysis] = useState<BlockAnalysis | null>(null);
  const [signinAnalysis, setSigninAnalysis] = useState<SigninAnalysis | null>(null);
  const [responsibilityMatrix, setResponsibilityMatrix] = useState<ResponsibilityMatrix | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [arrangementModalVisible, setArrangementModalVisible] = useState(false);
  const [arrangementForm] = Form.useForm();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
  const [expertsList, setExpertsList] = useState<any[]>([]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await projectsApi.checkExceptions(id);

      const [detailRes, analysisRes, timelineRes] = await Promise.all([
        projectsApi.detail(id),
        projectsApi.analysis(id),
        projectsApi.timeline(id),
      ]);
      setProject(detailRes.project);
      setArrangement(detailRes.arrangement);
      setSigninRecords(detailRes.signinRecords || []);
      setExceptions(detailRes.exceptions || []);
      setBlockAnalysis(analysisRes.blockAnalysis);
      setSigninAnalysis(analysisRes.signinAnalysis);
      setResponsibilityMatrix(analysisRes.responsibilityMatrix);
      setTimeline(timelineRes.events || []);
    } catch (error) {
      message.error('获取项目详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateArrangement = async () => {
    try {
      const values = await arrangementForm.validateFields();
      const selectedExpertIds = values.expertIds || [];
      const supervisionExpertId = values.supervisionExpertId || null;
      const supervisionExpert = expertsList.find((e) => e.id === supervisionExpertId);
      await arrangementsApi.create({
        projectId: id,
        biddingDate: values.biddingDate,
        biddingStartTime: values.biddingStartTime,
        biddingEndTime: values.biddingEndTime || '18:00:00',
        biddingLocation: values.biddingLocation,
        roomNumber: values.roomNumber || '默认会议室',
        expertIds: selectedExpertIds,
        supervisionExpertId,
        supervisionExpertName: supervisionExpert?.name || null,
        documentPreparation: true,
        venueReservation: true,
        equipmentCheck: false,
        materialPrinting: false,
        financeConfirmed: false,
        depositReceived: false,
        feeCalculated: false,
      });
      message.success('创建开评标安排成功');
      setArrangementModalVisible(false);
      arrangementForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleSubmitArrangement = async () => {
    if (!arrangement) return;
    try {
      await arrangementsApi.submit(arrangement.id);
      message.success('提交审核成功');
      fetchData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleApproveArrangement = async () => {
    if (!arrangement) return;
    try {
      await arrangementsApi.approve(arrangement.id, { reviewComment: '审核通过' });
      message.success('审核通过');
      fetchData();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleRejectArrangement = async () => {
    if (!arrangement) return;
    try {
      const values = await rejectForm.validateFields();
      await arrangementsApi.reject(arrangement.id, { rejectReason: values.rejectReason });
      message.success('退回成功');
      setRejectModalVisible(false);
      rejectForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('退回失败');
    }
  };

  const handleConfirmSignin = async (recordId: string) => {
    try {
      await signinApi.confirm(recordId, { signinMethod: 'manual', seatNumber: '' });
      message.success('签到确认成功');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAbsent = async (recordId: string) => {
    Modal.confirm({
      title: '确认标记缺席',
      content: '标记专家缺席将自动触发异常提醒，确认继续吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await signinApi.absent(recordId, { reason: '现场缺席' });
          message.success('已标记缺席，已触发异常提醒');
          fetchData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleTriggerSample = async (sampleType: string) => {
    try {
      await exceptionsApi.triggerSample({ projectId: id, sampleType });
      message.success('异常样例已触发，请查看异常列表');
      fetchData();
    } catch (error) {
      message.error('触发失败');
    }
  };

  const handleTransition = async (toStatus: string) => {
    if (!id) return;
    try {
      await projectsApi.transition(id, { toStatus });
      message.success('状态变更成功');
      fetchData();
    } catch (error) {
      message.error('状态变更失败');
    }
  };

  const loadExperts = async () => {
    try {
      const data = await expertsApi.list({ status: 'available' });
      setExpertsList(data);
    } catch (error) {
      console.error('获取专家列表失败', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'default',
      arrangement_pending: 'blue',
      arrangement_submitted: 'cyan',
      arrangement_reviewing: 'geekblue',
      arrangement_rejected: 'red',
      arrangement_approved: 'green',
      bidding_pending: 'orange',
      bidding_in_progress: 'gold',
      bidding_completed: 'cyan',
      expert_signin_pending: 'orange',
      expert_signin_in_progress: 'gold',
      expert_signin_completed: 'green',
      evaluation_in_progress: 'purple',
      evaluation_completed: 'green',
      archived: 'default',
    };
    return colorMap[status] || 'default';
  };

  const getTimelineColor = (type: string) => {
    const colorMap: Record<string, string> = {
      status_change: 'blue',
      action: 'green',
      exception: 'red',
      attachment: 'orange',
      notification: 'purple',
    };
    return colorMap[type] || 'gray';
  };

  const sampleTypes = [
    { value: 'arrangement_timeout', label: '开评标安排超时' },
    { value: 'arrangement_rejected', label: '开评标安排被退回' },
    { value: 'expert_absent', label: '专家缺席' },
    { value: 'expert_late', label: '专家迟到' },
    { value: 'signin_incomplete', label: '签到未完成' },
  ];

  if (!project) {
    return <Empty description="加载中..." />;
  }

  const analysisTab = (
    <div>
      {blockAnalysis?.isBlocked && (
        <Alert
          message="项目已阻塞"
          description={
            <div>
              <p>阻塞原因：{blockAnalysis.blockReason}</p>
              <p>
                阻塞责任人：{blockAnalysis.blockHandlerName}（
                {blockAnalysis.blockHandlerRole
                  ? roleNames[blockAnalysis.blockHandlerRole]
                  : ''}
                ）
              </p>
              <p>
                阻塞时长：{blockAnalysis.blockedDuration} 小时
              </p>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card className="analysis-card" title="责任矩阵">
            {responsibilityMatrix && (
              <div>
                <div
                  className={`responsibility-item project_specialist`}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    项目专员：{responsibilityMatrix.projectSpecialist.userName || '未分配'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    待办：{responsibilityMatrix.projectSpecialist.pendingTasks} 项
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    已完成：{responsibilityMatrix.projectSpecialist.completedTasks} 项
                  </div>
                </div>
                <div
                  className={`responsibility-item review_secretary`}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    评审秘书：{responsibilityMatrix.reviewSecretary.userName || '未分配'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    待办：{responsibilityMatrix.reviewSecretary.pendingTasks} 项
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    已完成：{responsibilityMatrix.reviewSecretary.completedTasks} 项
                  </div>
                </div>
                <div
                  className={`responsibility-item finance`}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    财务：{responsibilityMatrix.finance.userName || '未分配'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    待办：{responsibilityMatrix.finance.pendingTasks} 项
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    已完成：{responsibilityMatrix.finance.completedTasks} 项
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="analysis-card" title="卡点分析">
            {blockAnalysis && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="是否阻塞"
                      value={blockAnalysis.isBlocked ? '是' : '否'}
                      valueStyle={{ color: blockAnalysis.isBlocked ? '#ff4d4f' : '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="阻塞时长(小时)"
                      value={blockAnalysis.blockedDuration}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>待办事项：</strong>
                  </div>
                  {blockAnalysis.pendingActions.length > 0 ? (
                    <ul style={{ paddingLeft: 20 }}>
                      {blockAnalysis.pendingActions.map((action, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: '#999' }}>暂无待办事项</div>
                  )}
                  {blockAnalysis.nextHandler && (
                    <div style={{ marginTop: 12 }}>
                      <strong>下一处理人：</strong>
                      {blockAnalysis.nextHandler.userName || '待分配'}（
                      {blockAnalysis.nextHandler.roleName}）
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="analysis-card" title="签到分析">
            {signinAnalysis ? (
              <div>
                <div className="signin-progress">
                  <Progress
                type="circle"
                percent={signinAnalysis.signinRate}
                format={(percent) => `${percent}%`}
                status={signinAnalysis.isComplete ? 'success' : 'active'}
                style={{ display: 'block', margin: '0 auto' }}
              />
            </div>
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic title="应到" value={signinAnalysis.totalExperts} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已签到"
                  value={signinAnalysis.confirmedCount}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="缺席"
                  value={signinAnalysis.absentCount}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="请假"
                  value={signinAnalysis.leaveCount}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
            {!signinAnalysis.isComplete && signinAnalysis.incompleteReason && (
              <Alert
                message="签到未完成"
                description={signinAnalysis.incompleteReason}
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        ) : (
          <Empty description="暂无签到数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </Col>
  </Row>

  <Card
    title="异常样例测试"
    extra={
      <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => setExceptionModalVisible(true)}>
        触发异常样例
      </Button>
    }
  >
    <div style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
      点击按钮可以手动触发异常样例，用于测试异常提醒和退回机制是否正常工作。
    </div>
    {exceptions.length > 0 && (
      <List
        size="small"
        dataSource={exceptions.slice(0, 3)}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const sev = exceptionSeverityDisplay[item.severity as keyof typeof exceptionSeverityDisplay];
                    return <Tag color={sev?.color}>{sev?.label}</Tag>;
                  })()}
                  <span>{item.title}</span>
                  {(() => {
                    const st = exceptionStatusDisplay[item.status as keyof typeof exceptionStatusDisplay];
                    return <Tag color={st?.color}>{st?.label}</Tag>;
                  })()}
                </div>
              }
              description={
                <div style={{ fontSize: 12, color: '#999' }}>
                  类型：
                  {exceptionTypeDisplay[item.type as keyof typeof exceptionTypeDisplay]?.label} |
                  触发人：{item.triggeredBy === 'system' ? '系统' : item.triggeredBy} |
                  时间：{dayjs(item.triggeredAt).format('YYYY-MM-DD HH:mm')}
                </div>
              }
            />
          </List.Item>
        )}
      />
    )}
  </Card>
</div>
  );

  const arrangementTab = (
    <div>
      {arrangement ? (
        <div>
          <Card className="analysis-card" title="开评标安排信息">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="状态">
                {arrangement.statusDisplay ? (
                  <Tag color={arrangement.statusDisplay.color}>
                    {arrangement.statusDisplay.label}
                  </Tag>
                ) : (
                  <Tag>
                    {arrangementStatusDisplay[arrangement.status as keyof typeof arrangementStatusDisplay]?.label || arrangement.status}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {arrangement.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="开标地点">
                {arrangement.biddingLocation} {arrangement.roomNumber ? `(${arrangement.roomNumber})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="开标时间">
                {dayjs(`${arrangement.biddingDate}T${arrangement.biddingStartTime}`).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="评标地点">
                {arrangement.biddingLocation}
              </Descriptions.Item>
              <Descriptions.Item label="评标结束时间">
                {dayjs(`${arrangement.biddingDate}T${arrangement.biddingEndTime}`).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="专家人数">
                {arrangement.expertCount} 人
              </Descriptions.Item>
              <Descriptions.Item label="审核人">
                {arrangement.reviewerName || '待审核'}
              </Descriptions.Item>
              {arrangement.reviewComment && (
                <Descriptions.Item label="审核意见" span={2}>
                  {arrangement.reviewComment}
                </Descriptions.Item>
              )}
              {arrangement.rejectReason && (
                <Descriptions.Item label="退回原因" span={2}>
                  {arrangement.rejectReason}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Divider />
            <Descriptions column={4} size="small">
              <Descriptions.Item label="文件准备">
                {arrangement.documentPreparation ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="场地预约">
                {arrangement.venueReservation ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="设备检查">
                {arrangement.equipmentCheck ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="资料打印">
                {arrangement.materialPrinting ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="财务确认">
                {arrangement.financeConfirmed ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="押金到账">
                {arrangement.depositReceived ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="费用计算">
                {arrangement.feeCalculated ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="orange">未完成</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="修改次数">
                {arrangement.modificationCount || 0} 次
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                {(arrangement.status === 'pending' || arrangement.status === 'modified') && (
                  <>
                    <Button onClick={() => setArrangementModalVisible(true)}>修改</Button>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSubmitArrangement}
                    >
                      提交审核
                    </Button>
                  </>
                )}
                {arrangement.status === 'reviewing' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleApproveArrangement}
                    >
                      审核通过
                    </Button>
                    <Button
                      danger
                      icon={<WarningOutlined />}
                      onClick={() => setRejectModalVisible(true)}
                    >
                      退回修改
                    </Button>
                  </>
                )}
                {arrangement.status === 'rejected' && (
                  <>
                    <Button onClick={() => setArrangementModalVisible(true)}>修改</Button>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSubmitArrangement}
                    >
                      重新提交
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <Empty
            description="暂无开评标安排"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<FileTextOutlined />} onClick={() => setArrangementModalVisible(true)}>
              创建开评标安排
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  const signinTab = (
    <div>
      <Card className="analysis-card" title="专家签到记录">
        {signinRecords.length > 0 ? (
          <Table
            rowKey="id"
            dataSource={signinRecords}
            pagination={false}
            columns={[
              {
                title: '专家姓名',
                dataIndex: 'expertName',
                key: 'expertName',
              },
              {
                title: '专业领域',
                dataIndex: 'expertise',
                key: 'expertise',
              },
              {
                title: '是否监督',
                dataIndex: 'isSupervision',
                key: 'isSupervision',
                render: (val: boolean) => (val ? <Tag color="purple">是</Tag> : <Tag>否</Tag>),
              },
              {
                title: '签到状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: string, record: ExpertSigninRecord) => {
                  const disp = record.statusDisplay || signinStatusDisplay[status as keyof typeof signinStatusDisplay];
                  const color = disp?.color || 'default';
                  const label = disp?.label || status;
                  return <Tag color={color}>{label}</Tag>;
                },
              },
              {
                title: '预计到达',
                dataIndex: 'scheduledArrivalTime',
                key: 'scheduledArrivalTime',
                render: (time: string) =>
                  time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
              },
              {
                title: '签到时间',
                dataIndex: 'signinTime',
                key: 'signinTime',
                render: (time: string, record: ExpertSigninRecord) => {
                  const t = time || record.actualArrivalTime;
                  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-';
                },
              },
              {
                title: '签到方式',
                dataIndex: 'signinMethod',
                key: 'signinMethod',
                render: (method: string) => {
                  if (!method) return '-';
                  const map: Record<string, string> = {
                    manual: '人工',
                    card: '刷卡',
                    face: '人脸',
                    qr: '二维码',
                  };
                  return map[method] || method;
                },
              },
              {
                title: '备注',
                key: 'remark',
                render: (_: any, record: ExpertSigninRecord) => {
                  return (
                    record.leaveReason || record.signinCompleteReason || '-'
                  );
                },
              },
              {
                title: '操作',
                key: 'action',
                render: (_: any, record: ExpertSigninRecord) => (
                  <Space>
                    {record.status === 'pending' && (
                      <>
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleConfirmSignin(record.id)}
                        >
                          确认签到
                        </Button>
                        <Button
                          danger
                          size="small"
                          icon={<WarningOutlined />}
                          onClick={() => handleMarkAbsent(record.id)}
                        >
                          标记缺席
                        </Button>
                      </>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="暂无签到记录。开标完成后，推进到「准备专家签到」阶段时系统会自动生成签到记录。" />
        )}
      </Card>
    </div>
  );

  const timelineTab = (
    <Card className="analysis-card" title="操作时间线">
      {timeline.length > 0 ? (
        <Timeline
          mode="left"
          items={timeline.map((event) => ({
            color: getTimelineColor(event.type),
            label: dayjs(event.time).format('YYYY-MM-DD HH:mm:ss'),
            children: (
              <div className="timeline-item">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {event.title}
                  {event.operatorName && (
                    <Tag style={{ marginLeft: 8 }}>
                      {event.operatorName}
                      {event.operatorRole ? `（${event.operatorRole}）` : ''}
                    </Tag>
                  )}
                </div>
                <div style={{ color: '#666', marginBottom: 8 }}>{event.content}</div>
                {event.attachments && event.attachments.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>附件：</div>
                    {event.attachments.map((att: any, idx: number) => (
                      <Tag key={idx} color="blue">
                        {att.name}
                      </Tag>
                    ))}
                  </div>
                )}
                {event.metadata && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    {JSON.stringify(event.metadata)}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="暂无操作记录" />
      )}
    </Card>
  );

  const tabItems = [
    { key: 'analysis', label: '项目分析', children: analysisTab },
    { key: 'arrangement', label: '开评标安排', children: arrangementTab },
    { key: 'signin', label: '专家签到', children: signinTab },
    { key: 'timeline', label: '时间线', children: timelineTab },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/projects')}
            />
            <span>{project.name}</span>
            <Tag color={getStatusColor(project.status)}>
              {project.statusDisplay?.label || statusDisplay[project.status as keyof typeof statusDisplay]?.label || project.status}
            </Tag>
            {project.description && (
              <Tag color="red" icon={<WarningOutlined />}>
                已阻塞
              </Tag>
            )}
          </Space>
        }
        loading={loading}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="项目编号">{project.projectNo}</Descriptions.Item>
          <Descriptions.Item label="项目专员">
            {project.projectSpecialistName}
          </Descriptions.Item>
          <Descriptions.Item label="评审秘书">
            {project.reviewSecretaryName || '未分配'}
          </Descriptions.Item>
          <Descriptions.Item label="财务">
            {project.financeName || '未分配'}
          </Descriptions.Item>
          <Descriptions.Item label="当前处理人" span={2}>
            {project.currentHandlerName ? (
              <div>
                <span>{project.currentHandlerName}</span>
                <Tag style={{ marginLeft: 8 }}>
                  {project.currentHandlerRole
                    ? roleNames[project.currentHandlerRole]
                    : ''}
                </Tag>
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="客户名称" span={2}>
            {project.clientName}
          </Descriptions.Item>
          <Descriptions.Item label="预算金额" span={2}>
            ¥ {project.budgetAmount?.toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {project.status === 'arrangement_approved' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>安排已通过，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('bidding_pending')}>
              财务确认
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'bidding_pending' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>财务已确认，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('bidding_in_progress')}>
              开始开标
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'bidding_in_progress' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>开标进行中，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('bidding_completed')}>
              完成开标
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'bidding_completed' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>开标已完成，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('expert_signin_pending')}>
              准备专家签到
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'expert_signin_pending' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>专家签到准备就绪，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('expert_signin_in_progress')}>
              开始签到
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'expert_signin_completed' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>签到已完成，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('evaluation_in_progress')}>
              开始评标
            </Button>
          </Space>
        </Card>
      )}

      {project.status === 'evaluation_completed' && (
        <Card size="small" style={{ marginTop: 8 }}>
          <Space>
            <span>评标已完成，下一步：</span>
            <Button type="primary" onClick={() => handleTransition('archived')}>
              归档
            </Button>
          </Space>
        </Card>
      )}

      <Tabs defaultActiveKey="analysis" items={tabItems} />

      <Modal
        title="创建开评标安排"
        open={arrangementModalVisible}
        onOk={handleCreateArrangement}
        onCancel={() => {
          setArrangementModalVisible(false);
          arrangementForm.resetFields();
        }}
        width={600}
        destroyOnClose
      >
        <Form
          form={arrangementForm}
          layout="vertical"
          initialValues={
            arrangement
              ? {
                  biddingLocation: arrangement.biddingLocation,
                  roomNumber: arrangement.roomNumber,
                  biddingDate: arrangement.biddingDate,
                  biddingStartTime: arrangement.biddingStartTime,
                  biddingEndTime: arrangement.biddingEndTime,
                  expertIds: arrangement.expertIds || [],
                  supervisionExpertId: arrangement.supervisionExpertId || undefined,
                }
              : undefined
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="biddingLocation"
                label="开标地点"
                rules={[{ required: true, message: '请输入开标地点' }]}
              >
                <Input placeholder="请输入开标地点" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomNumber"
                label="会议室编号"
              >
                <Input placeholder="请输入会议室编号（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="biddingDate"
                label="开标日期"
                rules={[{ required: true, message: '请选择开标日期' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="biddingStartTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <Input type="time" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="biddingEndTime"
                label="结束时间"
              >
                <Input type="time" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="expertIds"
            label="评审专家"
            rules={[{ required: true, message: '请选择评审专家' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择评审专家"
              optionFilterProp="label"
              options={expertsList.map((e) => ({
                value: e.id,
                label: `${e.name}（${e.title} - ${e.organization}）`,
              }))}
              onDropdownVisibleChange={(open: boolean) => { if (open) loadExperts(); }}
            />
          </Form.Item>
          <Form.Item
            name="supervisionExpertId"
            label="监督专家"
          >
            <Select
              placeholder="请选择监督专家（可选）"
              allowClear
              optionFilterProp="label"
              options={expertsList.map((e) => ({
                value: e.id,
                label: `${e.name}（${e.title} - ${e.organization}）`,
              }))}
              onDropdownVisibleChange={(open: boolean) => { if (open) loadExperts(); }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退回开评标安排"
        open={rejectModalVisible}
        onOk={handleRejectArrangement}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectReason"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细说明退回原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="触发异常样例"
        open={exceptionModalVisible}
        onCancel={() => setExceptionModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          选择要触发的异常类型，系统将自动创建异常记录并发送通知给相关角色。
        </div>
        <Space wrap>
          {sampleTypes.map((sample) => (
            <Button
              key={sample.value}
              type="primary"
              danger
              icon={<ThunderboltOutlined />}
              onClick={() => {
                handleTriggerSample(sample.value);
                setExceptionModalVisible(false);
              }}
            >
              {sample.label}
            </Button>
          ))}
        </Space>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
