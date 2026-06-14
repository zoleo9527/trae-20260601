import { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import { carApi } from '../api';
import { AuthTokenPayload, CarSource } from '../types';

export default function CreateCarModal({ open, onClose, onSuccess, user }: {
  open: boolean;
  onClose: () => void;
  onSuccess: (car: CarSource) => void;
  user: AuthTokenPayload;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const car = await carApi.create(values);
      onSuccess(car);
      form.resetFields();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="录入新车源"
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item label="品牌" name="brand" rules={[{ required: true, message: '请输入品牌' }]}>
          <Input placeholder="如：丰田、本田、大众" />
        </Form.Item>
        <Form.Item label="车型" name="model" rules={[{ required: true, message: '请输入车型' }]}>
          <Input placeholder="如：凯美瑞 2.5G 豪华版" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="年份" name="year" rules={[{ required: true, message: '请输入年份' }]} style={{ flex: 1 }}>
            <InputNumber min={1990} max={2030} style={{ width: '100%' }} placeholder="如：2022" />
          </Form.Item>
          <Form.Item label="里程(公里)" name="mileage" rules={[{ required: true, message: '请输入里程' }]} style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：41000" />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="颜色" name="color" style={{ flex: 1 }}>
            <Input placeholder="如：珍珠白" />
          </Form.Item>
          <Form.Item label="车牌号" name="plateNumber" style={{ flex: 1 }}>
            <Input placeholder="如：京A88888" />
          </Form.Item>
        </div>
        <Form.Item label="车架号(VIN)" name="vin">
          <Input placeholder="如：LFV3A23C4M3XXXX01" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="车主姓名" name="ownerName" style={{ flex: 1 }}>
            <Input placeholder="如：陈先生" />
          </Form.Item>
          <Form.Item label="车主电话" name="ownerPhone" style={{ flex: 1 }}>
            <Input placeholder="如：13911112222" />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="来源渠道" name="sourceChannel" style={{ flex: 1 }}>
            <Input placeholder="如：老客户介绍、到店咨询、旧台账转入" />
          </Form.Item>
          <Form.Item label="车主期望价(元)" name="expectedPrice" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：175000" />
          </Form.Item>
        </div>
        <Form.Item label="初始备注(现场记录/旧台账情况)" name="remark">
          <Input.TextArea rows={3} placeholder="记录车况、来源、车主诉求等交班信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
