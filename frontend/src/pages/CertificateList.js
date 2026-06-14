import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { certificateApi, evaluationApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function CertificateList() {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    status: undefined,
    project_id: undefined,
    search: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchAction, setBatchAction] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, [pagination.page, filters]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await certificateApi.getList({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setCertificates(response.data.certificates || []);
      setStats(response.data.stats || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('获取证书列表失败:', error);
      message.error('获取证书列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCertificates();
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    }));
  };

  const handleBatchAction = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择要操作的证书');
      return;
    }

    try {
      await certificateApi.batchAction({
        certificate_ids: selectedRowKeys,
        action: batchAction,
        operator_id: user?.id,
        operator_name: user?.name,
        remark: '批量操作'
      });
      message.success('批量操作成功');
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      fetchCertificates();
    } catch (error) {
      console.error('批量操作失败:', error);
      message.error('批量操作失败');
    }
  };

  const columns = [
    {
      title: '证书编号',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      fixed: 'left',
      width: 150
    },
    { title: '培训项目', dataIndex: 'project_name', key: 'project_name' },
    { title: '姓名', dataIndex: 'user_name', key: 'user_name' },
    { title: '部门', dataIndex: 'user_department', key: 'user_department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="certificate" status={status} />
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/certificates/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = permissions.certificates?.includes('batch_process') ? {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  } : undefined;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="证书总数"
              value={stats.total || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已发放"
              value={stats.issued || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="异常"
              value={stats.abnormal || 0}
              valueStyle={{ color: stats.abnormal > 0 ? '#ff4d4f' : '#999' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="证书管理"
        extra={
          <Space>
            {permissions.certificates?.includes('batch_process') && (
              <>
                <Button
                  disabled={!selectedRowKeys.length}
                  onClick={() => {
                    setBatchAction('issued');
                    setBatchModalVisible(true);
                  }}
                >
                  批量发放
                </Button>
                <Button
                  disabled={!selectedRowKeys.length}
                  danger
                  onClick={() => {
                    setBatchAction('cancelled');
                    setBatchModalVisible(true);
                  }}
                >
                  批量取消
                </Button>
              </>
            )}
            <Button icon={<ReloadOutlined />} onClick={fetchCertificates}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索证书编号、姓名、部门..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="证书状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'issued', label: '已发放' },
                { value: 'abnormal', label: '异常' }
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={certificates}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
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
        title="批量操作确认"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onOk={handleBatchAction}
        okText="确认"
        cancelText="取消"
      >
        <p>
          确定要{batchAction === 'issued' ? '发放' : '取消'}选中的 {selectedRowKeys.length} 张证书吗？
        </p>
        <p style={{ color: '#999' }}>此操作将同时更新效果评估数据。</p>
      </Modal>
    </div>
  );
}

export default CertificateList;
