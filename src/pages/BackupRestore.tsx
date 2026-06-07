import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Upload,
  Alert,
} from 'antd';
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  RollbackOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import dayjs from 'dayjs';

const BackupRestore = () => {
  const createBackup = useStore((state) => state.createBackup);
  const restoreFromBackup = useStore((state) => state.restoreFromBackup);
  const deleteBackup = useStore((state) => state.deleteBackup);
  const exportBackup = useStore((state) => state.exportBackup);
  const importBackup = useStore((state) => state.importBackup);
  const resetData = useStore((state) => state.resetData);
  const items = useStore((state) => state.items);

  const [backups, setBackups] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const stored = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
    setBackups(stored.map((b: any) => b.metadata).reverse());
  };

  const handleCreateBackup = () => {
    createBackup(description || '手动备份');
    setIsCreateModalOpen(false);
    setDescription('');
    loadBackups();
    message.success('备份创建成功');
  };

  const handleRestore = (id: string) => {
    Modal.confirm({
      title: '确认恢复',
      icon: <WarningOutlined />,
      content: '恢复备份将覆盖当前所有数据，此操作不可撤销，确认继续吗？',
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        restoreFromBackup(id);
        message.success('数据恢复成功');
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteBackup(id);
    loadBackups();
    message.success('备份已删除');
  };

  const handleExport = (id: string) => {
    exportBackup(id);
    message.success('备份文件已导出');
  };

  const handleImport = (file: File) => {
    importBackup(file).then(() => {
      loadBackups();
      message.success('备份导入成功');
    }).catch(() => {
      message.error('导入失败，请检查文件格式');
    });
    return false;
  };

  const handleReset = () => {
    resetData();
    setIsResetModalOpen(false);
    message.success('数据已重置为初始样例');
  };

  const columns = [
    {
      title: '备份名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '备份时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '入库单数',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '记录总数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRestore(record.id)}
          >
            恢复
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CloudDownloadOutlined />}
            onClick={() => handleExport(record.id)}
          >
            导出
          </Button>
          <Popconfirm
            title="确认删除此备份？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalRecords = items.reduce(
    (sum, item) => sum + item.temperatureRecords.length + item.historyNotes.length,
    0
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">备份与恢复</h2>

      <Alert
        message="数据安全提示"
        description="系统使用本地存储（localStorage）保存数据。建议定期导出备份文件保存到安全位置，以防浏览器缓存清理导致数据丢失。"
        type="info"
        showIcon
        className="mb-4"
      />

      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic
              title="当前入库单数"
              value={items.length}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前记录总数"
              value={totalRecords}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="备份数量"
              value={backups.length}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="备份列表"
        extra={
          <Space>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<CloudUploadOutlined />}>导入备份</Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              创建备份
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={backups}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个备份`,
          }}
          locale={{ emptyText: '暂无备份记录，点击"创建备份"开始' }}
        />
      </Card>

      <Card
        title="系统工具"
        size="small"
        className="mt-4"
        style={{ borderLeft: '4px solid #faad14' }}
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setIsResetModalOpen(true)}
            danger
          >
            重置为样例数据
          </Button>
          <span className="text-gray-500 text-sm">
            此操作将清空所有自定义数据，恢复为初始样例数据
          </span>
        </Space>
      </Card>

      <Modal
        title="创建备份"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={handleCreateBackup}
        okText="创建"
      >
        <p className="mb-2 text-gray-600">备份将保存当前所有入库记录、温度记录和操作历史。</p>
        <Input.TextArea
          placeholder="请输入备份描述（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Modal>

      <Modal
        title="确认重置"
        open={isResetModalOpen}
        onCancel={() => setIsResetModalOpen(false)}
        onOk={handleReset}
        okText="确认重置"
        okType="danger"
      >
        <p>此操作将清空所有自定义数据，恢复为初始样例数据。</p>
        <p className="text-red-500 font-bold">建议先创建备份再执行此操作！</p>
      </Modal>
    </div>
  );
};

export default BackupRestore;
