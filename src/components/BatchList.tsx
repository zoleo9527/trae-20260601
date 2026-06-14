'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Tag, message, Spin } from 'antd';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import EyeOutlined from '@ant-design/icons/lib/icons/EyeOutlined';
import CheckCircleOutlined from '@ant-design/icons/lib/icons/CheckCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/lib/icons/CloseCircleOutlined';
import PlayCircleOutlined from '@ant-design/icons/lib/icons/PlayCircleOutlined';
import { ExamBatch, EXAM_BATCH_STATUS_MAP, ExamBatchStatus, Student } from '../types';
import { apiClient } from '../services/apiClient';
import { ExamBatchWorkflowSteps } from './WorkflowVisualization';
import dayjs from 'dayjs';

const { Option } = Select;

export default function BatchList() {
  const [batches, setBatches] = useState<ExamBatch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ExamBatch | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [batchesData, studentsData] = await Promise.all([
      apiClient.getExamBatches(),
      apiClient.getStudents(),
    ]);
    setBatches(batchesData);
    setStudents(studentsData);
    setLoading(false);
  };

  const statusColors: Record<ExamBatchStatus, string> = {
    pending: 'gold',
    submitted: 'blue',
    confirmed: 'green',
    exam_completed: 'purple',
    cancelled: 'red',
  };

  const columns = [
    { title: '批次编号', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: '考试日期', dataIndex: 'examDate', key: 'examDate' },
    { title: '考试时间', dataIndex: 'examTime', key: 'examTime' },
    { title: '考场位置', dataIndex: 'location', key: 'location' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: ExamBatchStatus) => (
        <Tag color={statusColors[status]}>
          {EXAM_BATCH_STATUS_MAP[status]}
        </Tag>
      ),
    },
    { 
      title: '提交人', 
      dataIndex: 'submitterName', 
      key: 'submitterName',
      render: (name: string, record: ExamBatch) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.submitTime}</div>
        </div>
      ),
    },
    { 
      title: '确认人', 
      dataIndex: 'confirmerName', 
      key: 'confirmerName',
      render: (name: string | undefined, record: ExamBatch) => (
        name ? (
          <div>
            <div>{name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.confirmTime}</div>
          </div>
        ) : '-'
      ),
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: ExamBatch) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewBatch(record)}>查看</Button>
          {record.status === 'pending' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleSubmit(record.id)}>提交</Button>
          )}
          {record.status === 'submitted' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleComplete(record.id)}>完成考试</Button>
          )}
          {record.status !== 'exam_completed' && (
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleCancel(record.id)}>取消</Button>
          )}
        </div>
      ),
    },
  ];

  const viewBatch = (batch: ExamBatch) => {
    setSelectedBatch(batch);
    setIsModalVisible(true);
  };

  const handleSubmit = async (id: string) => {
    const result = await apiClient.submitExamBatch(id);
    if (result.success) {
      message.success('提交成功');
      loadData();
    } else {
      message.error(result.error?.message || '提交失败');
    }
  };

  const handleConfirm = async (id: string) => {
    const result = await apiClient.confirmExamBatch(id);
    if (result.success) {
      message.success('确认成功');
      loadData();
    } else {
      message.error(result.error?.message || '确认失败');
    }
  };

  const handleComplete = async (id: string) => {
    const result = await apiClient.completeExam(id);
    if (result.success) {
      message.success('考试完成');
      loadData();
    } else {
      message.error(result.error?.message || '操作失败');
    }
  };

  const handleCancel = async (id: string) => {
    const result = await apiClient.cancelExamBatch(id);
    if (result.success) {
      message.success('已取消');
      loadData();
    } else {
      message.error(result.error?.message || '取消失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setSelectedBatch(null);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const result = await apiClient.createExamBatch({
        examDate: values.examDate.format('YYYY-MM-DD'),
        examTime: values.examTime.format('HH:mm'),
        location: values.location,
        students: values.students,
      });
      
      if (result.success) {
        message.success('创建成功，已自动生成学员通知');
        setIsModalVisible(false);
        loadData();
      } else {
        message.error(result.error?.message || '创建失败');
      }
    } catch (info) {
      message.error('表单验证失败');
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>考试批次管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建批次</Button>
      </div>
      <Table 
        dataSource={batches} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={selectedBatch ? '查看批次详情' : '新建考试批次'}
        visible={isModalVisible}
        onOk={selectedBatch ? () => setIsModalVisible(false) : handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        {selectedBatch ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3>基本信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong>批次编号：</strong>{selectedBatch.batchNumber}</div>
                <div><strong>考试日期：</strong>{selectedBatch.examDate}</div>
                <div><strong>考试时间：</strong>{selectedBatch.examTime}</div>
                <div><strong>考场位置：</strong>{selectedBatch.location}</div>
                <div><strong>状态：</strong><Tag color={statusColors[selectedBatch.status]}>{EXAM_BATCH_STATUS_MAP[selectedBatch.status]}</Tag></div>
                <div><strong>提交人：</strong>{selectedBatch.submitterName} ({selectedBatch.submitTime})</div>
                {selectedBatch.confirmerName && (
                  <div><strong>确认人：</strong>{selectedBatch.confirmerName} ({selectedBatch.confirmTime})</div>
                )}
              </div>
            </div>

            <ExamBatchWorkflowSteps 
              status={selectedBatch.status}
              submitterName={selectedBatch.submitterName}
              submitTime={selectedBatch.submitTime}
              confirmerName={selectedBatch.confirmerName}
              confirmTime={selectedBatch.confirmTime}
            />

            <div>
              <h3>学员列表</h3>
              <Table 
                dataSource={students.filter(s => selectedBatch.students.includes(s.id))} 
                columns={[
                  { title: '姓名', dataIndex: 'name', key: 'name' },
                  { title: '手机号', dataIndex: 'phone', key: 'phone' },
                  { title: '身份证号', dataIndex: 'idCard', key: 'idCard' },
                  { title: '培训时长', dataIndex: 'trainingHours', key: 'trainingHours', render: (h: number) => `${h}小时` },
                  { title: '材料状态', dataIndex: 'documentsComplete', key: 'documentsComplete', render: (c: boolean) => c ? '完整' : '缺失' },
                ]}
                pagination={false}
                size="small"
              />
            </div>
            {selectedBatch.exceptionRecords && selectedBatch.exceptionRecords.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3>异常记录</h3>
                <Table 
                  dataSource={selectedBatch.exceptionRecords} 
                  columns={[
                    { title: '学员', dataIndex: 'studentName', key: 'studentName' },
                    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => t === 'missing_documents' ? '材料缺失' : t === 'timeout' ? '超时' : '复核不通过' },
                    { title: '描述', dataIndex: 'description', key: 'description' },
                    { title: '状态', dataIndex: 'resolved', key: 'resolved', render: (r: boolean) => r ? '已处理' : '待处理' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </div>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="考试日期" name="examDate" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="考试时间" name="examTime" rules={[{ required: true }]}>
              <TimePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="考场位置" name="location" rules={[{ required: true }]}>
              <Select>
                <Option value="第一考场">第一考场</Option>
                <Option value="第二考场">第二考场</Option>
                <Option value="第三考场">第三考场</Option>
              </Select>
            </Form.Item>
            <Form.Item label="选择学员" name="students" rules={[{ required: true }]}>
              <Select mode="multiple">
                {students.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}