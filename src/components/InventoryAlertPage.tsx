import { useState } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button, Card, Input, Select, Table, Badge } from './common';
import { InventoryAlert } from '../types';

export function InventoryAlertPage() {
  const { alerts, skus, adjustments, handleAlert, currentRole } = useWorkbench();
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<InventoryAlert | null>(null);
  const [handleResult, setHandleResult] = useState('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesLevel = !filterLevel || alert.alertLevel === filterLevel;
    const matchesStatus = !filterStatus || alert.status === filterStatus;
    const sku = skus.find(s => s.id === alert.skuId);
    const matchesKeyword = !searchKeyword || 
      alert.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      sku?.name.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesLevel && matchesStatus && matchesKeyword;
  });

  const handleAlertAction = () => {
    if (selectedAlert && handleResult) {
      handleAlert(selectedAlert.id, currentRole === 'buyer' ? '采购刘' : '王经理', handleResult);
      setSelectedAlert(null);
      setHandleResult('');
    }
  };

  const getStockPercentage = (alert: InventoryAlert) => {
    return Math.round((alert.currentStock / alert.safetyStock) * 100);
  };

  const levelLabels: Record<string, string> = {
    red: '红色预警',
    orange: '橙色预警',
    yellow: '黄色预警'
  };

  const levelColors: Record<string, 'red' | 'orange' | 'yellow'> = {
    red: 'red',
    orange: 'orange',
    yellow: 'yellow'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决'
  };

  const statusColors: Record<string, 'yellow' | 'orange' | 'green'> = {
    pending: 'yellow',
    processing: 'orange',
    resolved: 'green'
  };

  const columns = [
    { key: 'id', label: '预警编号', width: '100px' },
    { key: 'skuName', label: '商品名称', width: '200px' },
    { key: 'currentStock', label: '当前库存', width: '100px' },
    { key: 'safetyStock', label: '安全库存', width: '100px' },
    { key: 'stockPercentage', label: '库存水位', width: '120px' },
    { key: 'alertLevel', label: '预警级别', width: '100px' },
    { key: 'status', label: '状态', width: '80px' },
    { key: 'createTime', label: '创建时间', width: '140px' },
    { key: 'relatedAdjustments', label: '关联调整', width: '120px' },
    { key: 'actions', label: '操作', width: '150px' }
  ];

  const tableData = filteredAlerts.map(alert => {
    const sku = skus.find(s => s.id === alert.skuId);
    const percentage = getStockPercentage(alert);
    const relatedAdj = adjustments.filter(a => alert.relatedAdjustments.includes(a.id));
    
    return {
      id: alert.id,
      skuName: sku?.name || '-',
      currentStock: alert.currentStock,
      safetyStock: alert.safetyStock,
      stockPercentage: (
        <div>
          <div style={{ width: '100px', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: alert.alertLevel === 'red' ? '#ff4d4f' : alert.alertLevel === 'orange' ? '#fa8c16' : '#faad14',
                width: `${Math.min(percentage, 100)}%`
              }} 
            />
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>{percentage}%</span>
        </div>
      ),
      alertLevel: <Badge color={levelColors[alert.alertLevel]}>{levelLabels[alert.alertLevel]}</Badge>,
      status: <Badge color={statusColors[alert.status]}>{statusLabels[alert.status]}</Badge>,
      createTime: alert.createTime,
      relatedAdjustments: relatedAdj.length > 0 ? relatedAdj.map(a => a.id).join(', ') : '-',
      actions: (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(currentRole === 'buyer' || currentRole === 'manager') && alert.status !== 'resolved' && (
            <Button size="small" onClick={() => setSelectedAlert(alert)}>处理</Button>
          )}
          <Button size="small" variant="secondary" onClick={() => {}}>详情</Button>
        </div>
      )
    };
  });

  const alertSummary = {
    red: alerts.filter(a => a.alertLevel === 'red' && a.status !== 'resolved').length,
    orange: alerts.filter(a => a.alertLevel === 'orange' && a.status !== 'resolved').length,
    yellow: alerts.filter(a => a.alertLevel === 'yellow' && a.status !== 'resolved').length
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>库存预警</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertSummary.red}</span>
            <span style={{ color: '#666' }}>红色预警</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fa8c16' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertSummary.orange}</span>
            <span style={{ color: '#666' }}>橙色预警</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#faad14' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{alertSummary.yellow}</span>
            <span style={{ color: '#666' }}>黄色预警</span>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索预警编号或商品名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: '全部级别' },
              { value: 'red', label: '红色预警' },
              { value: 'orange', label: '橙色预警' },
              { value: 'yellow', label: '黄色预警' }
            ]}
            value={filterLevel}
            onChange={setFilterLevel}
          />
          <Select
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'processing', label: '处理中' },
              { value: 'resolved', label: '已解决' }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>

        <Table
          columns={columns}
          data={tableData}
          rowKey="id"
        />
      </Card>

      {selectedAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '500px' }} title="处理库存预警">
            <div style={{ marginBottom: '16px' }}>
              <p><strong>预警编号:</strong> {selectedAlert.id}</p>
              <p><strong>商品:</strong> {skus.find(s => s.id === selectedAlert.skuId)?.name}</p>
              <p><strong>当前库存:</strong> {selectedAlert.currentStock}</p>
              <p><strong>安全库存:</strong> {selectedAlert.safetyStock}</p>
              <p><strong>预警级别:</strong> <Badge color={levelColors[selectedAlert.alertLevel]}>{levelLabels[selectedAlert.alertLevel]}</Badge></p>
              <p><strong>创建时间:</strong> {selectedAlert.createTime}</p>
              <p><strong>关联批号调整:</strong> {selectedAlert.relatedAdjustments.length > 0 ? selectedAlert.relatedAdjustments.join(', ') : '无'}</p>
            </div>
            <div>
              <label>处理方式</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="handleResult"
                    value="立即采购"
                    checked={handleResult === '立即采购'}
                    onChange={(e) => setHandleResult(e.target.value)}
                  />
                  立即采购
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="handleResult"
                    value="暂缓采购"
                    checked={handleResult === '暂缓采购'}
                    onChange={(e) => setHandleResult(e.target.value)}
                  />
                  暂缓采购
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="handleResult"
                    value="resolved"
                    checked={handleResult === 'resolved'}
                    onChange={(e) => setHandleResult(e.target.value)}
                  />
                  已解决
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setSelectedAlert(null)}>取消</Button>
              <Button onClick={handleAlertAction} disabled={!handleResult}>确认处理</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
