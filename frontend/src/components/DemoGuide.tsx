import React, { useState } from 'react';
import { 
  Drawer, 
  Button, 
  Space, 
  Steps, 
  Card, 
  Typography, 
  Tag, 
  Alert,
  Divider,
  Badge
} from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  SwapOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  ControlOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store';

const { Title, Text, Paragraph } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DemoGuide: React.FC<Props> = ({ visible, onClose }) => {
  const { setRole } = useAppStore();
  const [activeDemo, setActiveDemo] = useState<'normal' | 'exception' | null>(null);

  const normalFlowSteps = [
    {
      title: '主播助理创建锁定单',
      icon: <ShoppingCartOutlined />,
      role: 'ASSISTANT' as const,
      description: '新建库存锁定单，填写SKU信息、价格口径、预计开播时间',
      action: '点击「新建库存锁定单」按钮，填写表单后提交'
    },
    {
      title: '主播助理锁定库存',
      icon: <ShoppingCartOutlined />,
      role: 'ASSISTANT' as const,
      description: '编辑每个SKU的锁定数量，提交场控审核',
      action: '在订单详情中点击「编辑锁定库存」，设置锁定数量后提交'
    },
    {
      title: '场控审核通过',
      icon: <ControlOutlined />,
      role: 'STAGE_CONTROL' as const,
      description: '核对库存和价格口径，审核通过后自动流转到赠品配置',
      action: '切换到场控角色，点击「审核」按钮，选择审核通过'
    },
    {
      title: '售后组长配置赠品',
      icon: <GiftOutlined />,
      role: 'AFTER_SALES_LEAD' as const,
      description: '看到审核通过的订单，直接配置赠品（无缝衔接，无需额外通知）',
      action: '切换到售后组长角色，点击「配置赠品」，添加赠品后保存'
    },
    {
      title: '确认完成',
      icon: <CheckCircleOutlined />,
      role: 'AFTER_SALES_LEAD' as const,
      description: '确认赠品配置无误，完成整个流程',
      action: '点击「确认并完成」按钮，订单闭环'
    }
  ];

  const exceptionFlowSteps = [
    {
      title: '主播助理提交锁定单',
      icon: <ShoppingCartOutlined />,
      role: 'ASSISTANT' as const,
      description: '创建并提交库存锁定单（可故意设置价格口径有问题）',
      action: '新建锁定单，价格口径留空或设置错误'
    },
    {
      title: '场控审核驳回',
      icon: <CloseCircleOutlined />,
      role: 'STAGE_CONTROL' as const,
      description: '场控发现价格口径错误或库存问题，驳回并说明原因',
      action: '切换到场控角色，选择「驳回」，填写驳回原因'
    },
    {
      title: '场控退回订单（可选）',
      icon: <SwapOutlined />,
      role: 'STAGE_CONTROL' as const,
      description: '或者场控直接退回订单，让主播助理重新处理',
      action: '点击「退回」按钮，确认退回'
    },
    {
      title: '主播助理重新编辑',
      icon: <ShoppingCartOutlined />,
      role: 'ASSISTANT' as const,
      description: '看到驳回/退回的订单，查看原因后重新编辑',
      action: '切回主播助理，点击「重新编辑」，修改后再次提交'
    },
    {
      title: '重新进入正常流程',
      icon: <CheckCircleOutlined />,
      role: 'STAGE_CONTROL' as const,
      description: '修改后的订单重新进入审核流程',
      action: '场控再次审核通过，流转到赠品配置'
    }
  ];

  const switchToRole = (role: 'ASSISTANT' | 'STAGE_CONTROL' | 'AFTER_SALES_LEAD') => {
    setRole(role);
  };

  return (
    <Drawer
      title={
        <Space>
          <PlayCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>演示路径引导</span>
        </Space>
      }
      placement="left"
      width={480}
      open={visible}
      onClose={onClose}
      extra={
        <Button size="small" onClick={onClose}>收起</Button>
      }
    >
      <Alert
        message="系统核心价值"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>替代旧台账、现场记录、沟通截图</li>
            <li>避免价格口径错、赠品漏发、直播后退款暴涨</li>
            <li>库存锁定→赠品配置自然衔接，不丢责任人和历史</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card 
          title={
            <Space>
              <Badge status="success" />
              <span>路径一：正常推进流程</span>
            </Space>
          }
          size="small"
          onClick={() => setActiveDemo(activeDemo === 'normal' ? null : 'normal')}
          style={{ cursor: 'pointer' }}
          extra={
            <Tag color="green">推荐先看</Tag>
          }
        >
          <Text type="secondary">
            主播助理创建→锁定库存→场控审核→售后配置赠品→完成
          </Text>
          
          {activeDemo === 'normal' && (
            <div style={{ marginTop: 16 }}>
              <Divider style={{ margin: '12px 0' }} />
              <Steps
                direction="vertical"
                size="small"
                items={normalFlowSteps.map((step, index) => ({
                  icon: step.icon,
                  title: (
                    <Space>
                      {step.title}
                      <Tag 
                        color="blue" 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          switchToRole(step.role);
                        }}
                      >
                        切换到{step.role === 'ASSISTANT' ? '主播助理' : step.role === 'STAGE_CONTROL' ? '场控' : '售后组长'}
                      </Tag>
                    </Space>
                  ),
                  description: (
                    <div>
                      <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                        {step.description}
                      </Paragraph>
                      <Text type="warning" style={{ fontSize: 12 }}>
                        👉 {step.action}
                      </Text>
                    </div>
                  )
                }))}
              />
            </div>
          )}
        </Card>

        <Card 
          title={
            <Space>
              <Badge status="error" />
              <span>路径二：异常处理流程</span>
            </Space>
          }
          size="small"
          onClick={() => setActiveDemo(activeDemo === 'exception' ? null : 'exception')}
          style={{ cursor: 'pointer' }}
          extra={
            <Tag color="red">含驳回/退回</Tag>
          }
        >
          <Text type="secondary">
            审核驳回→查看原因→重新编辑→再次提交
          </Text>
          
          {activeDemo === 'exception' && (
            <div style={{ marginTop: 16 }}>
              <Divider style={{ margin: '12px 0' }} />
              <Steps
                direction="vertical"
                size="small"
                status="error"
                items={exceptionFlowSteps.map((step, index) => ({
                  icon: step.icon,
                  title: (
                    <Space>
                      {step.title}
                      {step.role && (
                        <Tag 
                          color="blue" 
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToRole(step.role);
                          }}
                        >
                          切换到{step.role === 'ASSISTANT' ? '主播助理' : step.role === 'STAGE_CONTROL' ? '场控' : '售后组长'}
                        </Tag>
                      )}
                    </Space>
                  ),
                  description: (
                    <div>
                      <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                        {step.description}
                      </Paragraph>
                      <Text type="warning" style={{ fontSize: 12 }}>
                        👉 {step.action}
                      </Text>
                    </div>
                  )
                }))}
              />
            </div>
          )}
        </Card>

        <Card title="现场压力感设计" size="small">
          <Space direction="vertical" size="small">
            <div>
              <Tag color="red">特急标签闪烁</Tag>
              <Text type="secondary"> 优先级为特急的订单会持续闪烁提醒</Text>
            </div>
            <div>
              <Tag color="orange">开播倒计时</Tag>
              <Text type="secondary"> 临近开播的订单显示倒计时，增强紧迫感</Text>
            </div>
            <div>
              <Tag color="blue">待办置顶</Tag>
              <Text type="secondary"> 待审核、待配置的订单单独分区置顶</Text>
            </div>
            <div>
              <Tag color="purple">全链路追踪</Tag>
              <Text type="secondary"> 每个操作都记录责任人、时间、备注</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </Drawer>
  );
};

export default DemoGuide;
