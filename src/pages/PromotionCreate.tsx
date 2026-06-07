
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, DatePicker, message, Space } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { promotionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function PromotionCreate() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: any) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await promotionApi.create({
        title: values.title,
        description: values.description,
        storeId: 's1',
        storeName: '便利店-望京店',
        deadline: values.deadline.format('YYYY-MM-DD'),
        specialistId: user.id,
        specialistName: user.name,
      });
      message.success('促销陈列创建成功');
      navigate('/promotion');
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate('/promotion')} className="mb-4">
          返回列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">新建促销陈列</h1>
      </div>

      <Card className="border-0 shadow-sm max-w-3xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            deadline: dayjs().add(7, 'day'),
          }}
        >
          <Form.Item
            name="title"
            label="陈列任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="例如：618夏季饮料堆头陈列" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="陈列要求说明"
            rules={[{ required: true, message: '请输入陈列要求' }]}
          >
            <TextArea
              rows={4}
              placeholder="详细描述陈列位置、商品摆放、道具使用等要求"
            />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="完成截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" size="large" htmlType="submit" loading={submitting} icon={<Save size={16} />}>
                创建任务
              </Button>
              <Button size="large" onClick={() => navigate('/promotion')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
