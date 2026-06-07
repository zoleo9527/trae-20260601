import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import {
  DifferenceStatusTag,
  DifferenceTypeTag,
} from '@/components/common/StatusTags';
import { HistoryTimeline } from '@/components/common/HistoryTimeline';
import { useState } from 'react';

const { TextArea } = Input;

export const DifferenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInventoryDifferenceById, updateDifferenceStatus, currentUser } = useStore();
  const difference = getInventoryDifferenceById(id || '');
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [form] = Form.useForm();

  if (!difference) {
    return (
      <Card>
        <p>差异单不存在</p>
        <Button onClick={() => navigate('/differences')}>返回列表</Button>
      </Card>
    );
  }

  const handleConfirm = () => {
    Modal.confirm({
      title: '确认差异',
      content: '确认要确认此差异吗？',
      onOk: () => {
        updateDifferenceStatus(difference.id, 'confirmed');
        message.success('已确认差异');
      },
    });
  };

  const handleResolve = () => {
    setResolveModalVisible(true);
  };

  const handleResolveSubmit = () => {
    form.validateFields().then((values) => {
      updateDifferenceStatus(difference.id, 'resolved', values.resolution);
      message.success('差异已解决');
      setResolveModalVisible(false);
    });
  };

  const handleAppeal = () => {
    Modal.confirm({
      title: '确认申诉',
      content: '确定要对此差异进行申诉吗？',
      onOk: () => {
        updateDifferenceStatus(difference.id, 'appealed');
        message.success('已提交申诉');
      },
    });
  };

  const getActionButtons = () => {
    const buttons: JSX.Element[] = [];

    if (currentUser.role === 'supervisor') {
      if (difference.status === 'pending') {
        buttons.push(
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
          >
            确认差异
          </Button>
        );
      }
      if (difference.status === 'confirmed' || difference.status === 'appealed') {
        buttons.push(
          <Button type="primary" onClick={handleResolve}>
            处理解决
          </Button>
        );
      }
    }

    if (currentUser.role === 'store_manager') {
      if (difference.status === 'confirmed') {
        buttons.push(
          <Button
            icon={<ExclamationCircleOutlined />}
            onClick={handleAppeal}
          >
            申诉
          </Button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/differences')}
        >
          返回列表
        </Button>
        <Space>{getActionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="差异单信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="差异单号" span={1}>
                <span className="font-mono text-blue-600">{difference.differenceNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="关联盘点单" span={1}>
                <span className="font-mono">{difference.checkNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="门店" span={1}>
                {difference.storeName}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <DifferenceStatusTag status={difference.status} />
              </Descriptions.Item>
              <Descriptions.Item label="商品名称" span={1}>
                {difference.productName}
              </Descriptions.Item>
              <Descriptions.Item label="SKU" span={1}>
                <span className="font-mono">{difference.sku}</span>
              </Descriptions.Item>
              <Descriptions.Item label="差异类型" span={1}>
                <DifferenceTypeTag type={difference.differenceType} />
              </Descriptions.Item>
              <Descriptions.Item label="成本单价" span={1}>
                ¥{difference.costPrice.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="系统库存" span={1}>
                {difference.systemQuantity}{difference.unit}
              </Descriptions.Item>
              <Descriptions.Item label="实际库存" span={1}>
                {difference.actualQuantity}{difference.unit}
              </Descriptions.Item>
              <Descriptions.Item label="差异数量" span={1}>
                <span className={difference.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                  {difference.difference > 0 ? '+' : ''}{difference.difference}{difference.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="差异金额" span={1}>
                <span className="font-bold text-red-600">¥{difference.differenceAmount.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="上报人" span={1}>
                {difference.reporter}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间" span={1}>
                {difference.reportedAt}
              </Descriptions.Item>
              {difference.handler && (
                <>
                  <Descriptions.Item label="处理人" span={1}>
                    {difference.handler}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间" span={1}>
                    {difference.handledAt}
                  </Descriptions.Item>
                </>
              )}
              {difference.resolution && (
                <Descriptions.Item label="处理方案" span={2}>
                  {difference.resolution}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="差异金额"
              value={difference.differenceAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
            <Divider />
            <Statistic
              title="差异数量"
              value={Math.abs(difference.difference)}
              suffix={difference.unit}
              valueStyle={{ 
                color: difference.difference > 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="处理历史">
        <HistoryTimeline items={difference.history} />
      </Card>

      <Modal
        title="处理差异"
        open={resolveModalVisible}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="resolution"
            label="处理方案"
            rules={[{ required: true, message: '请输入处理方案' }]}
          >
            <TextArea rows={4} placeholder="请描述处理方案和原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
