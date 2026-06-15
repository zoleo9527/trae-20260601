import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Checkbox,
  message,
  Switch
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { orderApi } from '../services/api';
import { useAppContext } from '../App';
import { BUSINESS_TYPES, MATERIALS } from '../types';
import dayjs from '../utils/dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function OrderCreate() {
  const navigate = useNavigate();
  const { currentUser, refreshStats } = useAppContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasInstallation, setHasInstallation] = useState(true);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const orderData = {
        ...values,
        expectedDelivery: values.expectedDelivery?.toISOString(),
        installTime: hasInstallation ? values.installTime?.toISOString() : null,
        operator: currentUser?.name
      };
      
      await orderApi.createOrder(orderData);
      message.success('订单创建成功');
      refreshStats();
      navigate('/orders?view=receptionist');
    } catch (e) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>录入新订单</Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            unit: 'cm',
            quantity: 1,
            colorMode: 'CMYK',
            urgent: false
          }}
        >
          <Title level={5} style={{ marginTop: 0 }}>基本信息</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="businessType"
                label="业务类型"
                rules={[{ required: true, message: '请选择业务类型' }]}
              >
                <Select placeholder="请选择">
                  {BUSINESS_TYPES.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="title"
                label="订单标题"
                rules={[{ required: true, message: '请输入订单标题' }]}
              >
                <Input placeholder="简要描述订单内容，如：XX公司门头招牌" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="详细要求"
                rules={[{ required: true, message: '请输入详细要求' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细描述客户要求、参考信息、注意事项等..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>规格参数</Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="width"
                label="宽度"
                rules={[{ required: true, message: '请输入宽度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="宽" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="height"
                label="高度"
                rules={[{ required: true, message: '请输入高度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="高" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item name="unit" label="单位">
                <Select>
                  <Option value="cm">厘米 (cm)</Option>
                  <Option value="mm">毫米 (mm)</Option>
                  <Option value="m">米 (m)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="material"
                label="材质"
                rules={[{ required: true, message: '请选择材质' }]}
              >
                <Select placeholder="请选择材质">
                  {MATERIALS.map(m => (
                    <Option key={m} value={m}>{m}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="colorMode" label="色彩模式">
                <Select>
                  <Option value="CMYK">CMYK (印刷)</Option>
                  <Option value="RGB">RGB (屏幕)</Option>
                  <Option value="PANTONE">PANTONE (专色)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>时间与安装</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="expectedDelivery"
                label="预计交付时间"
                rules={[{ required: true, message: '请选择交付时间' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="是否需要安装">
                <Switch 
                  checked={hasInstallation} 
                  onChange={setHasInstallation}
                />
              </Form.Item>
            </Col>
          </Row>

          {hasInstallation && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  name="installAddress"
                  label="安装地址"
                  rules={[{ required: true, message: '请输入安装地址' }]}
                >
                  <Input placeholder="请输入详细安装地址" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  name="installTime"
                  label="预计安装时间"
                  rules={[{ required: true, message: '请选择安装时间' }]}
                >
                  <DatePicker 
                    showTime 
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item name="urgent" label="紧急程度" valuePropName="checked">
                <Checkbox>
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    ⚠️ 急单（需加急处理）
                  </span>
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                保存订单
              </Button>
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
