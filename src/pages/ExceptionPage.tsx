import { Table, Tag, Space, Button, Modal, Form, Input, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useApi } from '@/services/api';
import { roleDisplayMap, exceptionTypeDisplayMap } from '@/utils/stateMachine';
import type { ColumnsType } from 'antd/es/table';
import type { ExceptionRecord } from '@/types';

export default function ExceptionPage() {
  const api = useApi();
  const exceptions = api.getExceptions();
  const [resolveModal, setResolveModal] = useState<{ open: boolean; record: ExceptionRecord | null }>({
    open: false,
    record: null,
  });
  const [form] = Form.useForm();

  const handleResolve = () => {
    form.validateFields().then((values) => {
      if (resolveModal.record) {
        api.resolveException(resolveModal.record.id, values.resolution);
        message.success('异常已处理');
        setResolveModal({ open: false, record: null });
        form.resetFields();
      }
    });
  };

  const columns: ColumnsType<ExceptionRecord> = [
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      render: (t) => (
        <Tag
          color={
            t === 'size_error'
              ? 'orange'
              : t === 'color_complaint'
              ? 'red'
              : t === 'install_time_change'
              ? 'blue'
              : 'default'
          }
        >
          {exceptionTypeDisplayMap[t] || t}
        </Tag>
      ),
      width: 120,
    },
    {
      title: '关联排产',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
      render: (v) => v || '-',
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag
          color={
            s === 'resolved'
              ? 'green'
              : s === 'pending'
              ? 'gold'
              : 'default'
          }
        >
          {s === 'resolved' ? '已解决' : s === 'pending' ? '待处理' : '已关闭'}
        </Tag>
      ),
      width: 100,
    },
    {
      title: '上报人',
      key: 'reporter',
      render: (_, record) => {
        const user = api.getAllUsers().find((u) => u.id === record.reportedBy);
        return user ? `${user.name} (${roleDisplayMap[user.role]})` : record.reportedBy;
      },
      width: 140,
    },
    {
      title: '上报时间',
      dataIndex: 'reportedAt',
      key: 'reportedAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
      width: 160,
    },
    {
      title: '处理人',
      key: 'handler',
      render: (_, record) => {
        if (!record.handledBy) return '-';
        const user = api.getAllUsers().find((u) => u.id === record.handledBy);
        return user ? `${user.name} (${roleDisplayMap[user.role]})` : record.handledBy;
      },
      width: 140,
    },
    {
      title: '解决方案',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (v) => v || '-',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.status === 'pending' && api.getCurrentUser().role === 'manager' ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setResolveModal({ open: true, record })}
          >
            处理
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>异常记录</h2>
        <p style={{ color: '#666' }}>
          系统自动记录尺寸错误、色差投诉、安装时间变更等异常情况，便于追踪和复盘
        </p>
      </div>
      <Table
        columns={columns}
        dataSource={exceptions}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <p><strong>问题描述:</strong> {record.description}</p>
              {record.resolution && (
                <p><strong>解决方案:</strong> {record.resolution}</p>
              )}
              {record.handledAt && (
                <p><strong>处理时间:</strong> {dayjs(record.handledAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title="处理异常"
        open={resolveModal.open}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModal({ open: false, record: null });
          form.resetFields();
        }}
        okText="确认处理"
        cancelText="取消"
      >
        {resolveModal.record && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>异常类型:</strong> {exceptionTypeDisplayMap[resolveModal.record.type]}</p>
            <p><strong>问题描述:</strong> {resolveModal.record.description}</p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="resolution" label="解决方案" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请输入解决方案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
