import { useState } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button, Card, Input, Select, Table, Badge } from './common';
import { Task } from '../types';

export function TodoTaskPage() {
  const { tasks, adjustments, alerts, completeTask, markTaskBatchComplete, notifications, currentRole, currentUserName } = useWorkbench();
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getTasksForCurrentRole = (taskList: Task[]) => {
    return taskList.filter(task => {
      if (currentRole === 'clerk') {
        return task.assignee === currentUserName && task.type === 'adjustment_audit';
      } else if (currentRole === 'manager') {
        return task.assignee === currentUserName && task.type === 'adjustment_audit';
      } else if (currentRole === 'buyer') {
        return task.assignee === currentUserName;
      }
      return false;
    });
  };

  const filteredTasks = getTasksForCurrentRole(tasks).filter(task => {
    const matchesType = !filterType || task.type === filterType;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesKeyword = !searchKeyword || 
      task.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      task.title.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesType && matchesPriority && matchesStatus && matchesKeyword;
  });

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
    if (continuousMode) {
      const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
      const currentPos = pendingTasks.findIndex(t => t.id === taskId);
      if (currentPos < pendingTasks.length - 1) {
        setCurrentIndex(currentPos + 1);
        setSelectedTask(pendingTasks[currentPos + 1]);
      } else {
        setContinuousMode(false);
        setSelectedTask(null);
      }
    } else {
      setSelectedTask(null);
    }
    setSelectedItems(prev => prev.filter(id => id !== taskId));
  };

  const handleBatchComplete = () => {
    if (selectedItems.length > 0) {
      markTaskBatchComplete(selectedItems, currentUserName);
      setSelectedItems([]);
    }
  };

  const typeLabels: Record<string, string> = {
    adjustment_audit: '批号调整',
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

  const roleLabels: Record<string, string> = {
    clerk: '店员',
    manager: '店长',
    buyer: '采购'
  };

  const columns = [
    { key: 'id', label: '任务编号', width: '100px' },
    { key: 'title', label: '任务标题', width: '280px' },
    { key: 'type', label: '任务类型', width: '100px' },
    { key: 'priority', label: '优先级', width: '80px' },
    { key: 'status', label: '状态', width: '80px' },
    { key: 'createTime', label: '创建时间', width: '140px' },
    { key: 'dueTime', label: '截止时间', width: '140px' },
    { key: 'actions', label: '操作', width: '100px' }
  ];

  const tableData = filteredTasks.map(task => {
    return {
      id: task.id,
      title: task.title,
      type: typeLabels[task.type],
      priority: <Badge color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>,
      status: <Badge color={statusColors[task.status]}>{statusLabels[task.status]}</Badge>,
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
    };
  });

  const roleTaskSummary = {
    pending: getTasksForCurrentRole(tasks).filter(t => t.status === 'pending').length,
    processing: getTasksForCurrentRole(tasks).filter(t => t.status === 'processing').length,
    completed: getTasksForCurrentRole(tasks).filter(t => t.status === 'completed').length
  };

  const unreadCount = notifications.filter(n => !n.read && 
    (n.targetRole === currentRole || n.targetRole === 'all')).length;

  const selectedPendingCount = selectedItems.filter(id => {
    const task = tasks.find(t => t.id === id);
    return task?.status === 'pending';
  }).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>待办任务</h2>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
            当前角色: {roleLabels[currentRole]} | 当前用户: {currentUserName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Badge color="red">{unreadCount} 条未读通知</Badge>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{roleTaskSummary.pending}</span>
            <span style={{ color: '#666' }}>待处理</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{roleTaskSummary.processing}</span>
            <span style={{ color: '#666' }}>处理中</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{roleTaskSummary.completed}</span>
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
              { value: 'adjustment_audit', label: '批号调整' },
              { value: 'alert_response', label: '库存预警响应' }
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
          
          {selectedItems.length > 0 ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>已选择 {selectedItems.length} 项</span>
              {selectedPendingCount > 0 && (
                <Button size="small" variant="success" onClick={handleBatchComplete}>
                  批量标记完成 ({selectedPendingCount})
                </Button>
              )}
              <Button size="small" variant="secondary" onClick={() => setSelectedItems([])}>取消选择</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              {!continuousMode && filteredTasks.filter(t => t.status !== 'completed').length > 0 && (
                <Button variant="secondary" size="small" onClick={() => {
                  const pendingIds = filteredTasks.filter(t => t.status === 'pending').map(t => t.id);
                  setSelectedItems(pendingIds);
                }}>全选待处理</Button>
              )}
              {!continuousMode && filteredTasks.filter(t => t.status !== 'completed').length > 0 && (
                <Button variant="secondary" onClick={() => { 
                  setContinuousMode(true); 
                  setCurrentIndex(0); 
                  const firstPending = filteredTasks.filter(t => t.status !== 'completed')[0];
                  setSelectedTask(firstPending || null); 
                }}>
                  连续处理模式
                </Button>
              )}
            </div>
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
          <Card style={{ width: '520px' }} title={selectedTask.title}>
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
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>关联批号调整</p>
                {(() => {
                  const adj = adjustments.find(a => a.id === selectedTask.relatedData);
                  if (adj) {
                    return (
                      <>
                        <p>申请单号: {adj.id}</p>
                        <p>状态: <Badge color={statusColors[adj.status]}>{adj.status === 'pending' ? '待审核' : adj.status === 'approved' ? '已通过' : adj.status === 'rejected' ? '已驳回' : '已完成'}</Badge></p>
                      </>
                    );
                  }
                  return <p>未找到关联申请</p>;
                })()}
              </div>
            )}
            {selectedTask.type === 'alert_response' && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fa8c16' }}>关联库存预警</p>
                {(() => {
                  const alt = alerts.find(a => a.id === selectedTask.relatedData || a.skuId === selectedTask.relatedData);
                  if (alt) {
                    return (
                      <>
                        <p>预警编号: {alt.id}</p>
                        <p>预警级别: <Badge color={alt.alertLevel === 'red' ? 'red' : alt.alertLevel === 'orange' ? 'orange' : 'yellow'}>{alt.alertLevel === 'red' ? '红色' : alt.alertLevel === 'orange' ? '橙色' : '黄色'}预警</Badge></p>
                        <p>当前库存: {alt.currentStock} / 安全库存: {alt.safetyStock}</p>
                      </>
                    );
                  }
                  return <p>未找到关联预警</p>;
                })()}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <div>
                {continuousMode && (
                  <>
                    <Button variant="secondary" size="small" onClick={() => {
                      const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
                      if (currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                        setSelectedTask(pendingTasks[currentIndex - 1]);
                      }
                    }} disabled={currentIndex === 0}>上一条</Button>
                    <span style={{ margin: '0 12px', color: '#666' }}>
                      {currentIndex + 1} / {filteredTasks.filter(t => t.status !== 'completed').length}
                    </span>
                    <Button variant="secondary" size="small" onClick={() => {
                      const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
                      if (currentIndex < pendingTasks.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        setSelectedTask(pendingTasks[currentIndex + 1]);
                      } else {
                        setContinuousMode(false);
                        setSelectedTask(null);
                      }
                    }} disabled={currentIndex === filteredTasks.filter(t => t.status !== 'completed').length - 1}>下一条</Button>
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
                {selectedTask.status !== 'completed' && (
                  <Button onClick={() => handleComplete(selectedTask.id)}>
                    {selectedTask.type === 'adjustment_audit' ? (selectedTask.title.includes('完成') ? '确认完成' : '完成任务') : '完成任务'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
