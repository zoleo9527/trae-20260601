import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Progress, Badge } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { InboxOutlined, LockOutlined, WarningOutlined, ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { api } from '@/api/mockApi';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS, LOCK_STATUS_MAP, LOCK_STATUS_COLORS, ROLE_MAP, OPERATION_TYPE_MAP } from '@/types';
import type { Order, OperationLog, TaskAssignment } from '@/types';

const STATUS_COUNTS = [
  { key: 'pending', label: '待处理', color: 'orange', icon: ClockCircleOutlined },
  { key: 'locked', label: '已锁货', color: 'blue', icon: LockOutlined },
  { key: 'allocated', label: '已分配', color: 'purple', icon: InboxOutlined },
  { key: 'picked', label: '已拣货', color: 'cyan', icon: InboxOutlined },
  { key: 'in_transit', label: '运输中', color: 'lime', icon: TruckOutlined },
  { key: 'delivered', label: '已送达', color: 'green', icon: CheckCircleOutlined },
  { key: 'completed', label: '已完成', color: 'gray', icon: CheckCircleOutlined },
];

export function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentLogs, setRecentLogs] = useState<OperationLog[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [riskOrders, setRiskOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [orders, logs, taskAssignments] = await Promise.all([
      api.orders.list(),
      api.operationLogs.list(),
      api.taskAssignments.list(undefined, 'pending'),
    ]);

    const statusCounts: Record<string, number> = {};
    STATUS_COUNTS.forEach(s => {
      statusCounts[s.key] = orders.filter(o => o.status === s.key).length;
    });
    statusCounts['risk'] = orders.filter(o => o.riskLevel === 'high' || o.riskLevel === 'medium').length;

    setStats(statusCounts);
    setRecentOrders(orders.slice(0, 8));
    setRecentLogs(logs.slice(0, 8));
    setTasks(taskAssignments.slice(0, 5));
    setRiskOrders(orders.filter(o => o.riskLevel === 'high' || o.riskLevel === 'medium').slice(0, 5));
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

  const taskColumns: ColumnType<TaskAssignment>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '任务类型', dataIndex: 'taskType', key: 'taskType', width: 80, render: (type: string) => {
      const types: Record<string, string> = {
        lock: '锁货',
        allocate: '库位分配',
        pick: '拣货',
        deliver: '送货',
        sign: '签收',
      };
      return <Tag color="blue">{types[type] || type}</Tag>;
    }},
    { title: '经办人', dataIndex: 'assigneeName', key: 'assigneeName', width: 100, render: (name: string, record: TaskAssignment) => (
      <span className="flex items-center gap-1">
        <UserOutlined style={{ fontSize: 12 }} />
        {name}
        <Tag color={record.assigneeRole === 'warehouse_manager' ? 'blue' : record.assigneeRole === 'driver' ? 'green' : 'orange'}>
          {ROLE_MAP[record.assigneeRole]}
        </Tag>
      </span>
    )},
    { title: '分配时间', dataIndex: 'assignedAt', key: 'assignedAt', width: 150 },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <Statistic
              title="今日订单"
              value={totalOrders}
              prefix={<InboxOutlined className="text-blue-600" />}
              suffix="单"
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
            <div className="mt-2">
              <Progress percent={completionRate} size="small" showInfo={false} strokeColor="#1890ff" />
              <span className="ml-2 text-sm text-gray-600">{completionRate}% 已完成</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <Statistic
              title="待处理"
              value={stats['pending'] || 0}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              suffix="单"
              valueStyle={{ color: '#fa8c16', fontSize: '28px' }}
            />
            <div className="mt-2 text-sm text-gray-600">
              等待锁货处理
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <Statistic
              title="进行中"
              value={(stats['locked'] || 0) + (stats['allocated'] || 0) + (stats['picked'] || 0)}
              prefix={<LockOutlined className="text-purple-600" />}
              suffix="单"
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
            />
            <div className="mt-2 text-sm text-gray-600">
              锁货/分配/拣货中
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <Statistic
              title="风险项"
              value={stats['risk'] || 0}
              prefix={<WarningOutlined className="text-red-600" />}
              suffix="项"
              valueStyle={{ color: '#f5222d', fontSize: '28px' }}
            />
            <div className="mt-2 text-sm text-gray-600">
              需关注处理
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="状态分布" className="h-full">
            <div className="space-y-3">
              {STATUS_COUNTS.map(status => {
                const Icon = status.icon;
                const count = stats[status.key] || 0;
                const percent = totalOrders > 0 ? Math.round(count / totalOrders * 100) : 0;
                return (
                  <div key={status.key} className="flex items-center gap-3">
                    <Icon style={{ color: status.color, fontSize: 18 }} />
                    <span className="flex-1">{status.label}</span>
                    <span className="w-12 text-right font-semibold">{count}</span>
                    <div className="flex-1">
                      <Progress percent={percent} size="small" showInfo={false} strokeColor={status.color} />
                    </div>
                    <span className="w-12 text-right text-sm text-gray-500">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="待处理任务" extra={<Badge count={tasks.length} color="red" />}>
            {tasks.length > 0 ? (
              <Table
                dataSource={tasks}
                columns={taskColumns}
                rowKey={(t) => t.orderId + t.taskType}
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无待处理任务</p>
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="风险订单" extra={<Badge count={riskOrders.length} color="orange" />}>
            {riskOrders.length > 0 ? (
              <div className="space-y-2">
                {riskOrders.map(order => (
                  <div key={order.id} className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{order.orderNo}</span>
                      <Badge color={order.riskLevel === 'high' ? 'red' : 'orange'} text={order.riskLevel === 'high' ? '高' : '中'} />
                    </div>
                    <div className="text-sm text-gray-600">{order.customerName}</div>
                    <div className="text-xs text-gray-500 mt-1">{order.riskReason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-4xl mb-2 text-green-500" />
                <p>暂无风险订单</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近订单" extra={<span className="text-gray-400">更新时间倒序</span>}>
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近操作记录">
            <Table
              dataSource={recentLogs}
              columns={logColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="订单流程概览" className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-center gap-2 py-4">
          {STATUS_COUNTS.slice(0, -1).map((status, index) => {
            const Icon = status.icon;
            const count = stats[status.key] || 0;
            return (
              <div key={status.key} className="flex items-center">
                <div className={`w-16 h-16 rounded-full bg-white shadow-sm flex flex-col items-center justify-center ${count > 0 ? 'ring-2 ring-' + status.color : ''}`}>
                  <Icon style={{ color: status.color }} />
                  <span className="text-xs font-bold mt-1" style={{ color: status.color }}>{count}</span>
                </div>
                <span className="text-xs text-gray-500 mt-4">{status.label}</span>
                {index < STATUS_COUNTS.length - 2 && (
                  <ArrowRightOutlined className="text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
