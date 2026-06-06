import React from 'react';
import { Card, Form, Input, InputNumber, DatePicker, Button, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/auth';

const { TextArea } = Input;

const CreateAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await appointmentsApi.create({
        ...values,
        scheduledArrivalTime: values.scheduledArrivalTime.toISOString(),
        creatorId: user?.id,
      });
      message.success('预约创建成功，等待调度员审核');
      navigate('/clerk/appointments');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  return (
    <Card title="新建到车预约">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="carrierName"
          label="承运商名称"
          rules={[{ required: true, message: '请输入承运商名称' }]}
        >
          <Input placeholder="请输入承运商名称" size="large" />
        </Form.Item>

        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="driverName"
            label="司机姓名"
            rules={[{ required: true, message: '请输入司机姓名' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="请输入司机姓名" size="large" />
          </Form.Item>

          <Form.Item
            name="driverPhone"
            label="司机电话"
            rules={[{ required: true, message: '请输入司机电话' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="请输入司机电话" size="large" />
          </Form.Item>
        </Space>

        <Form.Item
          name="plateNumber"
          label="车牌号"
          rules={[{ required: true, message: '请输入车牌号' }]}
        >
          <Input placeholder="请输入车牌号，如：京A12345" size="large" />
        </Form.Item>

        <Form.Item
          name="scheduledArrivalTime"
          label="预计到车时间"
          rules={[{ required: true, message: '请选择预计到车时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            size="large"
            placeholder="选择预计到车时间"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="cargoType"
            label="货物类型"
            rules={[{ required: true, message: '请输入货物类型' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="如：食品、电器、服装等" size="large" />
          </Form.Item>

          <Form.Item
            name="cargoWeight"
            label="货物重量（吨）"
            initialValue={0}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} size="large" />
          </Form.Item>
        </Space>

        <Form.Item
          name="warehouseZone"
          label="仓库区域"
        >
          <Input placeholder="如：A区、B区、冷藏区等" size="large" />
        </Form.Item>

        <Form.Item>
          <Space size="large">
            <Button type="primary" htmlType="submit" size="large">
              提交预约
            </Button>
            <Button size="large" onClick={() => navigate('/clerk/appointments')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreateAppointment;
