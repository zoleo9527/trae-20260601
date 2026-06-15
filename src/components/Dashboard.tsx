import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Progress, Badge, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { InboxOutlined, LockOutlined, WarningOutlined, ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { api } from '@/api/mockApi';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS, LOCK_STATUS_MAP, LOCK_STATUS_COLORS, ROLE_MAP, OPERATION_TYPE_MAP } from '@/types';
import type { Order, OperationLog } from '@/types';

const STATUS_COUNTS = [
  { key: 'pending', label: '待处理', color: 'orange', icon: ClockCircleOutlined },
  { key: 'locked', label: '已锁货', color: 'blue', icon: LockOutlined },
  { key: 'allocated', label: '已分配', color: 'purple', icon: InboxOutlined },
  { key: 'picked', label: '已拣货', color: 'cyan', icon: InboxOutlined },
  { key: 'in_transit', label: '运输中', color: 'lime', icon: TruckOutlined },
  { key: 'delivered', label: '已送达', color: 'green', icon: CheckCircleOutlined },
  { key: 'completed', label: '已完成', color: 'gray', icon: CheckCircleOutlined },
];

const ROLE_TASKS: Record<string, { label: string; statuses: string[]; color: string }> = {
  warehouse_manager: { label: '仓库主管', statuses: ['pending', 'locked', 'allocated'], color: 'blue' },
  driver: { label: '司机', statuses: ['picked', 'in_transit'], color: 'green' },
  customer_service: { label: '客服', statuses: ['delivered', 'signed'], color: 'orange' },
};

export function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentLogs, setRecentLogs] = useState<OperationLog[]>([]);
  const [riskOrders, setRiskOrders] = useState<Order[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Order[]>([]);
  const [currentRole, setCurrentRole] = useState('warehouse_manager');

  useEffect(() => {
    loadData();
  }, [currentRole]);

  const loadData = async () => {
    try {
      const [orders, logs] = await Promise.all([
        api.orders.list(),
        api.logs.list(),
      ]);

      const statusCounts: Record<string, number> = {};
      STATUS_COUNTS.forEach(s => {
        statusCounts[s.key] = orders.filter(o => o.status === s.key).length;
      });
      statusCounts['risk'] = orders.filter(o => o.riskLevel === 'high' || o.riskLevel === 'medium').length;

      const roleTasks = ROLE_TASKS[currentRole];
      const filteredTasks = orders.filter(o => roleTasks.statuses.includes(o.status));

      setStats(statusCounts);
      setRecentOrders(orders.slice(0, 8));
      setRecentLogs(logs.slice(0, 8));
      setRiskOrders(orders.filter(o => o.riskLevel === 'high' || o.riskLevel === 'medium').slice(0, 5));
      setPendingTasks(filteredTasks.slice(0, 6));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const totalOrders = Object.values(stats).filter((_, i) => i < STATUS_COUNTS.length).reduce((a, b) => a + b, 0);
  const completionRate = totalOrders > 0 ? Math.round((stats['completed'] || 0) / totalOrders * 100) : 0;

  const orderColumns: ColumnType<Order>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag color={ORDER_STATUS_COLORS[s as keyof typeof ORDER_STATUS_COLORS]}>
        {ORDER_STATUS_MAP[s as keyof typeof ORDER_STATUS_MAP]}
      </Tag>
    )},
    { title: '锁货', dataIndex: 'lockStatus', key: 'lockStatus', width: 80, render: (s: string) => (
      <Tag color={LOCK_STATUS_COLORS[s as keyof typeof LOCK_STATUS_COLORS]}>
        {LOCK_STATUS_MAP[s as keyof typeof LOCK_STATUS_MAP]}
      </Tag>
    )},
    { title: '风险', dataIndex: 'riskLevel', key: 'riskLevel', width: 60, render: (level: string) => {
      if (!level) return null;
      const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'yellow' };
      const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
      return <Badge color={colors[level]} text={labels[level]} />;
    }},
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
  ];

  const logColumns: ColumnType<OperationLog>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '操作', dataIndex: 'operationType', key: 'operationType', width: 80, render: (type: string) => (
      <span className="font-semibold">{OPERATION_TYPE_MAP[type as keyof typeof OPERATION_TYPE_MAP]}</span>
    )},
    { title: '操作人', dataIndex: 'operatorName', key: 'operatorName', width: 100, render: (name: string, record: OperationLog) => (
      <span className="flex items-center gap-1">
        <UserOutlined style={{ fontSize: 12 }} />
        {name}
        <Tag color={record.operatorRole === 'warehouse_manager' ? 'blue' : record.operatorRole === 'driver' ? 'green' : 'orange'}>
          {ROLE_MAP[record.operatorRole]}
        </Tag>
      </span>
    )},
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
  ];

  const taskColumns: ColumnType<Order>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
    { title: '待办事项', key: 'task', width: 120, render: (_: unknown, record: Order) => {
      const taskMap: Record<string, string> = {
        pending: '待锁货',
        locked: '待分配库位',
        allocated: '待拣货',
        picked: '待装车',
        in_transit: '待送达',
        delivered: '待签收',
        signed: '待完成',
      };
      return <Tag color="orange">{taskMap[record.status] || '未知'}</Tag>;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Tag color={ORDER_STATUS_COLORS[s as keyof typeof ORDER_STATUS_COLORS]}>
        {ORDER_STATUS_MAP[s as keyof typeof ORDER_STATUS_MAP]}
      </Tag>
    )},
    { title: '风险', dataIndex: 'riskLevel', key: 'riskLevel', width: 60, render: (level: string) => {
      if (!level) return null;
      const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'yellow' };
      const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
      return <Badge color={colors[level]} text={labels[level]} />;
    }},
  ];

  const roleInfo = ROLE_TASKS[currentRole];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">欢迎回来，张主管</h2>
            <Select
              value={currentRole}
              onChange={setCurrentRole}
              style={{ width: 160 }}
              options={[
                { value: 'warehouse_manager', label: '仓库主管' },
                { value: 'driver', label: '司机' },
                { value: 'customer_service', label: '客服' },
              ]}
            />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">订单完成率</div>
            <div className="flex items-center gap-2">
              <Progress type="circle" percent={completionRate} size={60} strokeColor="#52c41a" />
              <span className="text-2xl font-bold text-green-600">{completionRate}%</span>
            </div>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="今日订单"
              value={totalOrders}
              prefix={<InboxOutlined className="text-blue-600" />}
              suffix="单"
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待处理"
              value={stats['pending'] || 0}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              suffix="单"
              valueStyle={{ color: '#fa8c16', fontSize: '28px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="进行中"
              value={(stats['locked'] || 0) + (stats['allocated'] || 0) + (stats['picked'] || 0)}
              prefix={<LockOutlined className="text-purple-600" />}
              suffix="单"
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="风险项"
              value={stats['risk'] || 0}
              prefix={<WarningOutlined className="text-red-600" />}
              suffix="项"
              valueStyle={{ color: '#f5222d', fontSize: '28px' }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="状态分布">
            <div className="flex flex-wrap items-center gap-4">
              {STATUS_COUNTS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.key} className="flex items-center gap-2">
                    <Icon style={{ color: stat.color }} />
                    <span>{stat.label}</span>
                    <Badge color={stat.color} count={stats[stat.key] || 0} />
                    {index < STATUS_COUNTS.length - 1 && (
                      <ArrowRightOutlined className="text-gray-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="角色职责">
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <UserOutlined className="text-blue-500" />
                <span className="text-sm text-gray-600">仓库主管</span>
                <Tag color="blue">锁货/分配/拣货</Tag>
              </div>
              <div className="flex items-center gap-2">
                <TruckOutlined className="text-green-500" />
                <span className="text-sm text-gray-600">司机</span>
                <Tag color="green">装车/配送</Tag>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-orange-500" />
                <span className="text-sm text-gray-600">客服</span>
                <Tag color="orange">签收/完成</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={`待办任务 - ${roleInfo.label}`} extra={<Tag color={roleInfo.color}>待处理: {pendingTasks.length} 单</Tag>}>
            {pendingTasks.length > 0 ? (
              <Table
                dataSource={pendingTasks}
                columns={taskColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无待办任务</p>
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="操作日志" extra={<span className="text-sm text-gray-400">最近操作</span>}>
            {recentLogs.length > 0 ? (
              <Table
                dataSource={recentLogs}
                columns={logColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无操作日志</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近订单" extra={<span className="text-sm text-gray-400">最近更新</span>}>
            {recentOrders.length > 0 ? (
              <Table
                dataSource={recentOrders}
                columns={orderColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无订单</p>
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="风险订单">
            {riskOrders.length > 0 ? (
              <Table
                dataSource={riskOrders}
                columns={[
                  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
                  { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
                  { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
                    <Tag color={ORDER_STATUS_COLORS[s as keyof typeof ORDER_STATUS_COLORS]}>
                      {ORDER_STATUS_MAP[s as keyof typeof ORDER_STATUS_MAP]}
                    </Tag>
                  )},
                  { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80, render: (level: string) => {
                    const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'yellow' };
                    const labels: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
                    return <Tag color={colors[level]}>{labels[level]}</Tag>;
                  }},
                  { title: '风险原因', dataIndex: 'riskReason', key: 'riskReason' },
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无风险订单</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
