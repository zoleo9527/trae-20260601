import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Modal,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { evaluationApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function EvaluationList() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({});
  const [avgScores, setAvgScores] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    report_status: undefined
  });
  const [recalculateModalVisible, setRecalculateModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    fetchEvaluations();
  }, [pagination.page, filters]);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const response = await evaluationApi.getList({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setEvaluations(response.data.evaluations || []);
      setStats(response.data.stats || {});
      setAvgScores(response.data.avgScores || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('获取效果评估列表失败:', error);
      message.error('获取效果评估列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedProjectId) {
      message.warning('请选择要重新计算的项目');
      return;
    }

    try {
      await evaluationApi.recalculate(selectedProjectId, '手动重新计算');
      message.success('重新计算完成');
      setRecalculateModalVisible(false);
      fetchEvaluations();
    } catch (error) {
      console.error('重新计算失败:', error);
      message.error('重新计算失败');
    }
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    }));
  };

  const columns = [
    { title: '培训项目', dataIndex: 'project_name', key: 'project_name' },
    {
      title: '满意度',
      dataIndex: 'satisfaction_score',
      key: 'satisfaction_score',
      render: (score) => score ? `${score}/5` : '-'
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      key: 'completion_rate',
      render: (rate) => rate ? `${rate}%` : '-'
    },
    {
      title: '通过率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      render: (rate) => rate ? `${rate}%` : '-'
    },
    {
      title: '发放率',
      dataIndex: 'issuance_rate',
      key: 'issuance_rate',
      render: (rate) => rate ? `${rate}%` : '-'
    },
    {
      title: '报告状态',
      dataIndex: 'report_status',
      key: 'report_status',
      render: (status) => <StatusBadge type="evaluation" status={status} />
    },
    {
      title: '最后更新',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/evaluations/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="评估报告总数"
              value={stats.total || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.published || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="草稿"
              value={stats.draft || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已冻结"
              value={stats.frozen || 0}
              valueStyle={{ color: stats.frozen > 0 ? '#ff4d4f' : '#999' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="效果评估"
        extra={
          <Space>
            {permissions.evaluations?.includes('recalculate') && (
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => setRecalculateModalVisible(true)}
              >
                重新计算
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={fetchEvaluations}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Select
              placeholder="报告状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.report_status}
              onChange={(value) => setFilters({ ...filters, report_status: value })}
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'published', label: '已发布' },
                { value: 'frozen', label: '已冻结' }
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={evaluations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="重新计算效果评估"
        open={recalculateModalVisible}
        onCancel={() => setRecalculateModalVisible(false)}
        onOk={handleRecalculate}
        okText="确认重新计算"
        cancelText="取消"
      >
        <p>此操作将根据当前证书和培训数据重新计算效果评估指标。</p>
        <p style={{ color: '#999' }}>建议在证书数据发生重大变化后执行此操作。</p>
      </Modal>
    </div>
  );
}

export default EvaluationList;
