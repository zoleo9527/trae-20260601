
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, DatePicker, Select, message, Space } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { inspectionApi, promotionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { PromotionDisplay } from '../../shared/types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function InspectionCreate() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<PromotionDisplay[]>([]);

  useEffect(() => {
    promotionApi.getAll().then(setPromotions).catch(console.error);
  }, []);

  const onFinish = async (values: any) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const selectedPromo = promotions.find((p) => p.id === values.promotionId);
      await inspectionApi.create({
        title: values.title,
        description: values.description,
        requirement: values.requirement,
        storeId: 's1',
        storeName: '便利店-望京店',
        promotionId: values.promotionId,
        deadline: values.deadline.format('YYYY-MM-DD'),
        supervisorId: user.id,
        supervisorName: user.name,
      });
      message.success('巡店整改创建成功');
      navigate('/inspection');
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate('/inspection')} className="mb-4">
          返回列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">发起巡店整改</h1>
      </div>

      <Card className="border-0 shadow-sm max-w-3xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            deadline: dayjs().add(3, 'day'),
          }}
        >
          <Form.Item
            name="promotionId"
            label="关联促销陈列（可选）"
            help="选择关联的促销陈列任务，备注将自动同步"
          >
            <Select placeholder="选择关联的促销陈列..." allowClear>
              {promotions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="简要描述问题，例如：饮料堆头陈列不规范" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="问题详细描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea
              rows={3}
              placeholder="详细描述发现的问题、位置、严重程度等"
            />
          </Form.Item>

          <Form.Item
            name="requirement"
            label="整改要求"
            rules={[{ required: true, message: '请输入整改要求' }]}
          >
            <TextArea
              rows={3}
              placeholder="明确说明需要如何整改、达到什么标准"
            />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="整改截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" size="large" htmlType="submit" loading={submitting} icon={<Save size={16} />}>
                发起整改
              </Button>
              <Button size="large" onClick={() => navigate('/inspection')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
