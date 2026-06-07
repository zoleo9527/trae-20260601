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
  Tabs,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import {
  LossStatusTag,
  LossTypeTag,
} from '@/components/common/StatusTags';
import { HistoryTimeline } from '@/components/common/HistoryTimeline';
import { useState } from 'react';

const { TextArea } = Input;
const { TabPane } = Tabs;

export const LossDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLossRecordById, updateLossStatus, currentUser } = useStore();
  const loss = getLossRecordById(id || '');
  const [concludeModalVisible, setConcludeModalVisible] = useState(false);
  const [concludeForm] = Form.useForm();

  if (!loss) {
    return (
      <Card>
        <p>损耗记录不存在</p>
        <Button onClick={() => navigate('/loss')}>返回列表</Button>
      </Card>
    );
  }

  const handleStartAnalysis = () => {
    Modal.confirm({
      title: '开始分析',
      content: '确认要开始分析此损耗记录吗？',
      onOk: () => {
        updateLossStatus(loss.id, 'analyzing');
        message.success('已开始分析');
      },
    });
  };

  const handleConclude = () => {
    setConcludeModalVisible(true);
  };

  const handleConcludeSubmit = () => {
    concludeForm.validateFields().then((values) => {
      updateLossStatus(loss.id, 'concluded', values);
      message.success('已完成分析结案');
      setConcludeModalVisible(false);
    });
  };

  const getActionButtons = () => {
    const buttons: JSX.Element[] = [];

    if (currentUser.role === 'product_specialist' || currentUser.role === 'supervisor') {
      if (loss.status === 'recorded') {
        buttons.push(
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartAnalysis}
          >
            开始分析
          </Button>
        );
      }
      if (loss.status === 'analyzing') {
        buttons.push(
          <Button
            type="primary"
            icon={<FileDoneOutlined />}
            onClick={handleConclude}
          >
            结案
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
          onClick={() => navigate('/loss')}
        >
          返回列表
        </Button>
        <Space>{getActionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="损耗记录信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="报损单号" span={1}>
                <span className="font-mono text-blue-600">{loss.lossNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <LossStatusTag status={loss.status} />
              </Descriptions.Item>
              <Descriptions.Item label="门店" span={1}>
                {loss.storeName}
              </Descriptions.Item>
              <Descriptions.Item label="损耗类型" span={1}>
                <LossTypeTag type={loss.lossType} />
              </Descriptions.Item>
              <Descriptions.Item label="商品名称" span={1}>
                {loss.productName}
              </Descriptions.Item>
              <Descriptions.Item label="SKU" span={1}>
                <span className="font-mono">{loss.sku}</span>
              </Descriptions.Item>
              <Descriptions.Item label="损耗数量" span={1}>
                {loss.quantity}{loss.unit}
              </Descriptions.Item>
              <Descriptions.Item label="成本单价" span={1}>
                ¥{loss.costPrice.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="损耗金额" span={1}>
                <span className="font-bold text-red-600">¥{loss.lossAmount.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="上报人" span={1}>
                {loss.reportedBy}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间" span={1}>
                {loss.reportedAt}
              </Descriptions.Item>
              {loss.analysis?.analyst && (
                <>
                  <Descriptions.Item label="分析员" span={1}>
                    {loss.analysis.analyst}
                  </Descriptions.Item>
                  <Descriptions.Item label="分析时间" span={1}>
                    {loss.analysis.analyzedAt}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="损耗描述" span={2}>
                {loss.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="损耗金额"
              value={loss.lossAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
            <Divider />
            <Statistic
              title="损耗数量"
              value={loss.quantity}
              suffix={loss.unit}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="分析详情" key="1">
            {loss.analysis ? (
              <div className="space-y-4">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="根本原因">
                    {loss.analysis.rootCause || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预防措施">
                    {loss.analysis.preventiveMeasure || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="责任方">
                    {loss.analysis.responsibleParty || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理结论">
                    {loss.analysis.conclusion || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无分析数据
              </div>
            )}
          </TabPane>
          <TabPane tab="处理历史" key="2">
            {loss.analysis?.history ? (
              <HistoryTimeline items={loss.analysis.history} />
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无处理历史
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="分析结案"
        open={concludeModalVisible}
        onOk={handleConcludeSubmit}
        onCancel={() => setConcludeModalVisible(false)}
        width={700}
      >
        <Form form={concludeForm} layout="vertical">
          <Form.Item
            name="rootCause"
            label="根本原因"
            rules={[{ required: true, message: '请输入根本原因' }]}
            initialValue={loss.analysis?.rootCause}
          >
            <TextArea rows={3} placeholder="请描述损耗的根本原因..." />
          </Form.Item>
          <Form.Item
            name="preventiveMeasure"
            label="预防措施"
            rules={[{ required: true, message: '请输入预防措施' }]}
            initialValue={loss.analysis?.preventiveMeasure}
          >
            <TextArea rows={3} placeholder="请描述预防此类损耗的措施..." />
          </Form.Item>
          <Form.Item
            name="responsibleParty"
            label="责任方"
            rules={[{ required: true, message: '请输入责任方' }]}
            initialValue={loss.analysis?.responsibleParty}
          >
            <Input placeholder="请输入责任方..." />
          </Form.Item>
          <Form.Item
            name="conclusion"
            label="处理结论"
            rules={[{ required: true, message: '请输入处理结论' }]}
            initialValue={loss.analysis?.conclusion}
          >
            <TextArea rows={3} placeholder="请描述最终处理结论..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
