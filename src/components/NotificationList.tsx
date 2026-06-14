import { useState } from 'react';
import { Table, Button, Modal, Tag, message, Select } from 'antd';
import BellOutlined from '@ant-design/icons/lib/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/lib/icons/CheckCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/lib/icons/CloseCircleOutlined';
import EyeOutlined from '@ant-design/icons/lib/icons/EyeOutlined';
import { StudentNotification, STUDENT_NOTIFICATION_STATUS_MAP, StudentNotificationStatus, RoleType } from '../types';
import { getNotifications, sendNotification, confirmNotification, markAbsent, completeNotification } from '../api/notification';
import { examBatches } from '../data/mockData';
import { NotificationWorkflowSteps } from './WorkflowVisualization';

const { Option } = Select;

const currentUser = {
  id: 'u1',
  name: '张三',
  role: 'registrar' as RoleType,
};

export default function NotificationList() {
  const [notifications, setNotifications] = useState<StudentNotification[]>(getNotifications());
  const [selectedNotification, setSelectedNotification] = useState<StudentNotification | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterBatch, setFilterBatch] = useState<string>('');

  const statusColors: Record<StudentNotificationStatus, string> = {
    pending: 'gold',
    notified: 'blue',
    confirmed: 'green',
    absent: 'red',
    completed: 'purple',
  };

  const filteredNotifications = filterBatch 
    ? notifications.filter(n => n.batchId === filterBatch)
    : notifications;

  const columns = [
    { title: '批次编号', dataIndex: 'batchId', key: 'batchId', render: (id: string) => {
      const batch = examBatches.find(b => b.id === id);
      return batch?.batchNumber || id;
    }},
    { title: '学员姓名', dataIndex: 'studentName', key: 'studentName' },
    { 
      title: '通知状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: StudentNotificationStatus) => (
        <Tag color={statusColors[status]}>
          {STUDENT_NOTIFICATION_STATUS_MAP[status]}
        </Tag>
      ),
    },
    { 
      title: '通知人', 
      dataIndex: 'notifierName', 
      key: 'notifierName',
      render: (name: string, record: StudentNotification) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.notifyTime}</div>
        </div>
      ),
    },
    { 
      title: '确认时间', 
      dataIndex: 'confirmTime', 
      key: 'confirmTime',
      render: (time: string | undefined) => time || '-',
    },
    { 
      title: '备注', 
      dataIndex: 'remarks', 
      key: 'remarks',
      render: (remarks: string | undefined) => remarks || '-',
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: StudentNotification) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewNotification(record)}>查看</Button>
          {record.status === 'pending' && (
            <Button size="small" type="primary" icon={<BellOutlined />} onClick={() => handleSend(record.id)}>发送通知</Button>
          )}
          {record.status === 'notified' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
          )}
          {record.status === 'pending' && (
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleMarkAbsent(record.id)}>标记缺考</Button>
          )}
        </div>
      ),
    },
  ];

  const viewNotification = (notification: StudentNotification) => {
    setSelectedNotification(notification);
    setIsModalVisible(true);
  };

  const handleSend = (id: string) => {
    const result = sendNotification(id, 'u2', '李四', 'trainer');
    if (result.success) {
      setNotifications(getNotifications());
      message.success('通知已发送');
    } else {
      message.error(result.error?.message || '发送失败');
    }
  };

  const handleConfirm = (id: string) => {
    const result = confirmNotification(id, 'u3', '王五', 'safety_officer');
    if (result.success) {
      setNotifications(getNotifications());
      message.success('已确认');
    } else {
      message.error(result.error?.message || '确认失败');
    }
  };

  const handleComplete = (id: string) => {
    const result = completeNotification(id, 'u2', '李四', 'trainer');
    if (result.success) {
      setNotifications(getNotifications());
      message.success('已完成');
    } else {
      message.error(result.error?.message || '操作失败');
    }
  };

  const handleMarkAbsent = (id: string) => {
    const result = markAbsent(id, '学员未确认', 'u2', '李四', 'trainer');
    if (result.success) {
      setNotifications(getNotifications());
      message.success('已标记缺考');
    } else {
      message.error(result.error?.message || '操作失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>学员通知管理</h2>
        <Select 
          placeholder="按批次筛选" 
          style={{ width: 200 }}
          value={filterBatch}
          onChange={setFilterBatch}
        >
          <Option value="">全部批次</Option>
          {examBatches.map(batch => (
            <Option key={batch.id} value={batch.id}>{batch.batchNumber}</Option>
          ))}
        </Select>
      </div>
      <Table 
        dataSource={filteredNotifications} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="通知详情"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        {selectedNotification && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><strong>批次编号：</strong>{examBatches.find(b => b.id === selectedNotification.batchId)?.batchNumber}</div>
              <div><strong>学员姓名：</strong>{selectedNotification.studentName}</div>
              <div><strong>通知状态：</strong><Tag color={statusColors[selectedNotification.status]}>{STUDENT_NOTIFICATION_STATUS_MAP[selectedNotification.status]}</Tag></div>
              <div><strong>通知人：</strong>{selectedNotification.notifierName}</div>
              <div><strong>通知时间：</strong>{selectedNotification.notifyTime}</div>
              <div><strong>确认时间：</strong>{selectedNotification.confirmTime || '-'}</div>
              <div><strong>备注：</strong>{selectedNotification.remarks || '-'}</div>
            </div>

            <NotificationWorkflowSteps 
              status={selectedNotification.status}
              notifierName={selectedNotification.notifierName}
              notifyTime={selectedNotification.notifyTime}
              confirmTime={selectedNotification.confirmTime}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
