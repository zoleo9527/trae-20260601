import { useState } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button, Card, Input, Select, Table, Badge } from './common';
import { Task } from '../types';

export function TodoTaskPage() {
  const { tasks, adjustments, alerts, completeTask, notifications, currentRole } = useWorkbench();
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredTasks = tasks.filter(task => {
    const matchesType = !filterType || task.type === filterType;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesKeyword = !searchKeyword || 
      task.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      task.title.toLowerCase().includes(searchKeyword.toLowerCase());
    const isManagerAlertTask = currentRole === 'manager' && task.type === 'alert_response';
    const matchesRole = currentRole === 'clerk' ? task.type === 'adjustment_audit' : 
                       currentRole === 'manager' ? !isManagerAlertTask : true;
    return matchesType && matchesPriority && matchesStatus && matchesKeyword && matchesRole;
  });

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
    if (continuousMode) {
      const currentTaskIndex = filteredTasks.findIndex(t => t.id === taskId);
      if (currentTaskIndex < filteredTasks.length - 1) {
        setCurrentIndex(currentTaskIndex + 1);
        setSelectedTask(filteredTasks[currentTaskIndex + 1]);
      } else {
        setContinuousMode(false);
        setSelectedTask(null);
      }
    } else {
      setSelectedTask(null);
    }
  };

  const typeLabels: Record<string, string> = {
    adjustment_audit: '批号调整审核',
    emergency_adjustment: '紧急批号调整',
    alert_response: '库存预警响应',
    purchase_confirm: '采购计划确认'
  };

  const priorityLabels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };

  const priorityColors: Record<string, 'red' | 'orange' | 'yellow'> = {
    high: 'red',
    medium: 'orange',
    low: 'yellow'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  };

  const statusColors: Record<string, 'yellow' | 'orange' | 'green'> = {
    pending: 'yellow',
    processing: 'orange',
    completed: 'green'
  };

  const columns = [
    { key: 'id', label: '任务编号', width: '100px' },
    { key: 'title', label: '任务标题', width: '250px' },
    { key: 'type', label: '任务类型', width: '120px' },
    { key: 'priority', label: '优先级', width: '100px' },
    { key: 'status', label: '状态', width: '80px' },
    { key: 'assignee', label: '负责人', width: '100px' },
    { key: 'createTime', label: '创建时间', width: '140px' },
    { key: 'dueTime', label: '截止时间', width: '140px' },
    { key: 'actions', label: '操作', width: '120px' }
  ];

  const tableData = filteredTasks.map(task => ({
    id: task.id,
    title: task.title,
    type: typeLabels[task.type],
    priority: <Badge color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>,
    status: <Badge color={statusColors[task.status]}>{statusLabels[task.status]}</Badge>,
    assignee: task.assignee,
    createTime: task.createTime,
    dueTime: task.dueTime || '-',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        {task.status !== 'completed' && (
          <Button size="small" onClick={() => setSelectedTask(task)}>处理</Button>
        )}
        {task.status === 'completed' && (
          <Badge color="green">已完成</Badge>
        )}
      </div>
    )
  }));

  const taskSummary = {
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const unreadCount = notifications.filter(n => !n.read && 
    (n.targetRole === currentRole || n.targetRole === 'all')).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>待办任务</h2>
        {unreadCount > 0 && (
          <Badge color="red">{unreadCount} 条未读通知</Badge>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{taskSummary.pending}</span>
            <span style={{ color: '#666' }}>待处理</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{taskSummary.processing}</span>
            <span style={{ color: '#666' }}>处理中</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{taskSummary.completed}</span>
            <span style={{ color: '#666' }}>已完成</span>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索任务编号或标题"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: '全部类型' },
              { value: 'adjustment_audit', label: '批号调整审核' },
              { value: 'emergency_adjustment', label: '紧急批号调整' },
              { value: 'alert_response', label: '库存预警响应' },
              { value: 'purchase_confirm', label: '采购计划确认' }
            ]}
            value={filterType}
            onChange={setFilterType}
          />
          <Select
            options={[
              { value: '', label: '全部优先级' },
              { value: 'high', label: '高优先级' },
              { value: 'medium', label: '中优先级' },
              { value: 'low', label: '低优先级' }
            ]}
            value={filterPriority}
            onChange={setFilterPriority}
          />
          <Select
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'processing', label: '处理中' },
              { value: 'completed', label: '已完成' }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          {!continuousMode && filteredTasks.length > 0 && (
            <Button variant="secondary" onClick={() => { setContinuousMode(true); setCurrentIndex(0); setSelectedTask(filteredTasks[0]); }}>
              连续处理模式
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          data={tableData}
          rowKey="id"
          selectedKeys={selectedItems}
          onSelect={(key, checked) => {
            setSelectedItems(prev => 
              checked ? [...prev, key] : prev.filter(k => k !== key)
            );
          }}
        />
      </Card>

      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '500px' }} title={selectedTask.title}>
            <div style={{ marginBottom: '16px' }}>
              <p><strong>任务编号:</strong> {selectedTask.id}</p>
              <p><strong>任务类型:</strong> {typeLabels[selectedTask.type]}</p>
              <p><strong>优先级:</strong> <Badge color={priorityColors[selectedTask.priority]}>{priorityLabels[selectedTask.priority]}</Badge></p>
              <p><strong>状态:</strong> <Badge color={statusColors[selectedTask.status]}>{statusLabels[selectedTask.status]}</Badge></p>
              <p><strong>负责人:</strong> {selectedTask.assignee}</p>
              <p><strong>创建时间:</strong> {selectedTask.createTime}</p>
              {selectedTask.dueTime && <p><strong>截止时间:</strong> {selectedTask.dueTime}</p>}
            </div>
            {selectedTask.type === 'adjustment_audit' && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f7fa', borderRadius: '4px' }}>
                <p><strong>关联申请信息:</strong></p>
                {adjustments.find(a => a.id === selectedTask.relatedData) && (
                  <p>申请单号: {selectedTask.relatedData}</p>
                )}
              </div>
            )}
            {selectedTask.type === 'alert_response' && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f7fa', borderRadius: '4px' }}>
                <p><strong>关联预警信息:</strong></p>
                {alerts.find(a => a.id === selectedTask.relatedData) && (
                  <p>预警编号: {selectedTask.relatedData}</p>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <div>
                {continuousMode && (
                  <>
                    <Button variant="secondary" size="small" onClick={() => {
                      if (currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                        setSelectedTask(filteredTasks[currentIndex - 1]);
                      }
                    }} disabled={currentIndex === 0}>上一条</Button>
                    <span style={{ margin: '0 12px', color: '#666' }}>{currentIndex + 1} / {filteredTasks.length}</span>
                    <Button variant="secondary" size="small" onClick={() => {
                      if (currentIndex < filteredTasks.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        setSelectedTask(filteredTasks[currentIndex + 1]);
                      }
                    }} disabled={currentIndex === filteredTasks.length - 1}>下一条</Button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {continuousMode && (
                  <Button variant="secondary" onClick={() => { setContinuousMode(false); setSelectedTask(null); }}>退出连续模式</Button>
                )}
                {!continuousMode && (
                  <Button variant="secondary" onClick={() => setSelectedTask(null)}>取消</Button>
                )}
                <Button onClick={() => handleComplete(selectedTask.id)}>完成任务</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
