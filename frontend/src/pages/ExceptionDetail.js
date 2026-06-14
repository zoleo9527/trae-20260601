import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Row,
  Col,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Alert,
  Steps,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  SolutionOutlined,
  QuestionCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { exceptionApi, authApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function ExceptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    exception: null,
    history: [],
    project: null
  });
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [users, setUsers] = useState([]);
  const [actionForm] = Form.useForm();

  useEffect(() => {
    fetchExceptionDetail();
    fetchUsers();
  }, [id]);

  const fetchExceptionDetail = async () => {
    setLoading(true);
    try {
      const response = await exceptionApi.getDetail(id);
      setData(response.data);
    } catch (error) {
      console.error('获取异常详情失败:', error);
      message.error('获取异常详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authApi.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const handleAction = async () => {
    const values = await actionForm.validateFields();

    let actionData = {
      operator_id: user?.id,
      operator_name: user?.name,
      remark: values.remark
    };

    switch (actionType) {
      case 'assigned':
        actionData = {
          ...actionData,
          status: 'assigned',
          assigned_to: values.assigned_to,
          assigned_to_name: users.find(u => u.id === values.assigned_to)?.name
        };
        break;
      case 'processing':
        actionData = { ...actionData, status: 'processing' };
        break;
      case 'resolved':
        actionData = {
          ...actionData,
          status: 'resolved',
          resolution: values.resolution,
          resolved_by: user?.id,
          resolved_by_name: user?.name
        };
        break;
      case 'closed':
        actionData = { ...actionData, status: 'closed' };
        break;
      default:
        break;
    }

    try {
      await exceptionApi.update(id, actionData);
      message.success('操作成功');
      setActionModalVisible(false);
      actionForm.resetFields();
      fetchExceptionDetail();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  const openActionModal = (type) => {
    setActionType(type);
    setActionModalVisible(true);
  };

  const getActionFormItems = () => {
    switch (actionType) {
      case 'assigned':
        return (
          <>
            <Form.Item
              name="assigned_to"
              label="分配给"
              rules={[{ required: true, message: '请选择处理人' }]}
            >
              <Select
                options={users
                  .filter(u => u.role !== 'training_manager')
                  .map(u => ({
                    value: u.id,
                    label: `${u.name} (${u.role === 'department_head' ? '部门负责人' : '讲师'})`
                  }))}
              />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        );
      case 'resolved':
        return (
          <>
            <Form.Item
              name="resolution"
              label="解决方案"
              rules={[{ required: true, message: '请输入解决方案' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        );
      case 'processing':
      case 'closed':
        return (
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'assigned':
        return '分配处理人';
      case 'processing':
        return '开始处理';
      case 'resolved':
        return '标记已解决';
      case 'closed':
        return '关闭异常';
      default:
        return '操作';
    }
  };

  const getActionOptions = () => {
    if (!data.exception) return [];

    const options = [];
    const status = data.exception.status;

    if (status === 'discovered' && permissions.exceptions?.includes('assign')) {
      options.push({ value: 'assigned', label: '分配处理人', icon: <UserAddOutlined /> });
    }

    if ((status === 'assigned' || status === 'discovered') && permissions.exceptions?.includes('resolve')) {
      options.push({ value: 'processing', label: '开始处理', icon: <ClockCircleOutlined /> });
    }

    if (status === 'processing' && permissions.exceptions?.includes('resolve')) {
      options.push({ value: 'resolved', label: '标记已解决', icon: <CheckCircleOutlined /> });
    }

    if (status === 'resolved' && permissions.exceptions?.includes('resolve')) {
      options.push({ value: 'closed', label: '关闭异常', icon: <SolutionOutlined /> });
    }

    return options;
  };

  const getTypeLabel = (type) => {
    const labels = {
      registration_absent: '报名后缺席',
      homework_not_submitted: '作业未提交',
      certificate_error: '证书信息错误',
      certificate_duplicate: '证书重复发放',
      certificate_missed: '证书漏发'
    };
    return labels[type] || type;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'discovered':
        return <ClockCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'assigned':
        return <UserAddOutlined style={{ color: '#faad14' }} />;
      case 'processing_started':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'resolved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'closed':
        return <SolutionOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getActionText = (action) => {
    const labels = {
      discovered: '异常被标记',
      assigned: '已分配处理人',
      processing_started: '开始处理',
      resolved: '已解决',
      closed: '已关闭'
    };
    return labels[action] || action;
  };

  const getRootCauseAnalysis = (exception) => {
    const analyses = {
      registration_absent: {
        reasons: [
          '员工未提前取消报名或请假',
          '培训时间与其他工作冲突',
          '培训内容与工作需求不匹配',
          '缺少有效的报名确认机制'
        ],
        suggestions: [
          '加强培训前的确认提醒',
          '优化培训时间安排',
          '提供取消报名的便捷渠道',
          '评估培训内容的实用性'
        ]
      },
      homework_not_submitted: {
        reasons: [
          '作业难度与培训内容脱节',
          '员工工作繁忙无暇完成',
          '缺少作业提交的提醒机制',
          '作业提交方式不够便捷'
        ],
        suggestions: [
          '简化作业内容，聚焦核心要点',
          '设置阶段性提醒',
          '提供多种提交方式',
          '考虑将作业纳入考核体系'
        ]
      },
      certificate_error: {
        reasons: [
          '原始数据录入错误',
          '系统数据同步问题',
          '多人协作时的信息不一致',
          '证书模板使用错误'
        ],
        suggestions: [
          '核对原始报名数据',
          '检查系统数据同步',
          '建立信息复核机制',
          '规范证书制作流程'
        ]
      },
      certificate_duplicate: {
        reasons: [
          '系统重复生成记录',
          '操作人员重复提交',
          '数据导入时重复记录',
          '缺少唯一性校验'
        ],
        suggestions: [
          '检查并清理重复记录',
          '在系统中添加去重逻辑',
          '加强操作人员的培训',
          '完善数据导入的校验机制'
        ]
      },
      certificate_missed: {
        reasons: [
          '员工未全程参加培训',
          '员工中途退出培训',
          '系统未自动生成证书',
          '证书制作遗漏'
        ],
        suggestions: [
          '核对考勤记录',
          '确认员工是否达到发证条件',
          '检查系统自动生成逻辑',
          '建立证书发放清单核对'
        ]
      }
    };

    return analyses[exception.type] || null;
  };

  if (!data.exception) {
    return <Card loading={loading}>加载中...</Card>;
  }

  const { exception, history, project } = data;
  const rootCauseAnalysis = getRootCauseAnalysis(exception);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/exceptions')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="异常详情"
            extra={
              getActionOptions().length > 0 && (
                <Select
                  placeholder="执行操作"
                  style={{ width: 160 }}
                  onChange={openActionModal}
                  options={getActionOptions()}
                />
              )
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="异常编号">
                <Tag color="orange">{exception.exception_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="异常类型">
                <Tag color="orange">{getTypeLabel(exception.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="培训项目" span={2}>
                {exception.project_name}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {exception.description}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <StatusBadge type="priority" status={exception.priority} />
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge type="exception" status={exception.status} />
              </Descriptions.Item>
              <Descriptions.Item label="发现人">
                {exception.discovered_by_name}
              </Descriptions.Item>
              <Descriptions.Item label="发现时间">
                {dayjs(exception.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {exception.assigned_to_name && (
                <>
                  <Descriptions.Item label="处理人">
                    {exception.assigned_to_name}
                  </Descriptions.Item>
                </>
              )}
              {exception.resolved_by_name && (
                <>
                  <Descriptions.Item label="解决人">
                    {exception.resolved_by_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决时间">
                    {exception.resolved_at ? dayjs(exception.resolved_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </>
              )}
              {exception.resolution && (
                <Descriptions.Item label="解决方案" span={2}>
                  {exception.resolution}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="处理历史" style={{ marginTop: 16 }}>
            <Timeline
              mode="left"
              items={history.map((item, index) => ({
                dot: getActionIcon(item.action),
                children: (
                  <div key={index}>
                    <div style={{ fontWeight: 'bold' }}>
                      {getActionText(item.action)}
                    </div>
                    <div style={{ color: '#666' }}>
                      操作人: {item.operator_name}
                    </div>
                    {item.remark && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {item.remark}
                      </div>
                    )}
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {exception.type.startsWith('certificate_') && (
            <Card title="证书影响" style={{ marginBottom: 16 }}>
              <div style={{ color: '#ff4d4f' }}>
                <ClockCircleOutlined /> 此异常已冻结效果评估报告
              </div>
              <Button
                type="link"
                onClick={() => navigate(`/evaluations?project_id=${exception.project_id}`)}
                style={{ padding: 0, marginTop: 8 }}
              >
                查看效果评估 →
              </Button>
            </Card>
          )}

          {rootCauseAnalysis && exception.status !== 'resolved' && exception.status !== 'closed' && (
            <Card title="异常分析" style={{ marginBottom: 16 }}>
              <Alert
                message="可能原因"
                description={
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    {rootCauseAnalysis.reasons.map((reason, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>{reason}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                icon={<QuestionCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Alert
                message="处理建议"
                description={
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    {rootCauseAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>{suggestion}</li>
                    ))}
                  </ul>
                }
                type="info"
                showIcon
                icon={<BulbOutlined />}
              />
            </Card>
          )}

          <Card title="处理进度">
            <Steps
              current={
                exception.status === 'discovered' ? 0 :
                exception.status === 'assigned' ? 1 :
                exception.status === 'processing' ? 2 :
                exception.status === 'resolved' ? 3 :
                exception.status === 'closed' ? 4 : 0
              }
              direction="vertical"
              size="small"
              items={[
                {
                  title: '发现异常',
                  description: exception.discovered_by_name,
                  icon: <ClockCircleOutlined />
                },
                {
                  title: '分配处理',
                  description: exception.assigned_to_name || '待分配',
                  icon: <UserAddOutlined />
                },
                {
                  title: '处理中',
                  status: exception.status === 'processing' ? 'process' : 'wait',
                  icon: <ClockCircleOutlined />
                },
                {
                  title: '已解决',
                  status: exception.status === 'resolved' || exception.status === 'closed' ? 'finish' : 'wait',
                  icon: <CheckCircleOutlined />
                }
              ]}
            />
          </Card>

          <Card title="关联培训项目">
            {project ? (
              <>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
                  <Descriptions.Item label="培训时间">
                    {dayjs(project.start_date).format('YYYY-MM-DD')} 至{' '}
                    {dayjs(project.end_date).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="讲师">{project.instructor_name}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <StatusBadge type="training" status={project.status} />
                  </Descriptions.Item>
                </Descriptions>
                <Button
                  type="link"
                  onClick={() => navigate(`/training/${exception.project_id}`)}
                  style={{ padding: 0, marginTop: 8 }}
                >
                  查看培训详情 →
                </Button>
              </>
            ) : (
              <div style={{ color: '#999' }}>暂无关联项目信息</div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={getActionLabel()}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        onOk={handleAction}
        okText="确认"
        cancelText="取消"
      >
        <Form form={actionForm} layout="vertical">
          {getActionFormItems()}
        </Form>
      </Modal>
    </div>
  );
}

export default ExceptionDetail;
