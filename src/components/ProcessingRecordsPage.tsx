import { useState } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button, Card, Input, Select, Table, Badge } from './common';
import { BatchAdjustment, InventoryAlert } from '../types';

type RecordWithType = (BatchAdjustment & { recordType: 'adjustment' }) | (InventoryAlert & { recordType: 'alert' });

export function ProcessingRecordsPage() {
  const { adjustments, alerts, skus, batches } = useWorkbench();
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RecordWithType | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const allRecords: RecordWithType[] = [
    ...adjustments.map(adj => ({ ...adj, recordType: 'adjustment' as const })),
    ...alerts.map(alt => ({ ...alt, recordType: 'alert' as const }))
  ];

  const filteredRecords = allRecords.filter(record => {
    const matchesType = !filterType || record.recordType === filterType;
    
    let matchesStatus = true;
    if (record.recordType === 'adjustment') {
      matchesStatus = !filterStatus || record.status === filterStatus;
    } else {
      matchesStatus = !filterStatus || record.status === filterStatus;
    }

    const sku = skus.find(s => s.id === record.skuId);
    const matchesKeyword = !searchKeyword || 
      record.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      sku?.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (record.recordType === 'adjustment' && record.applicant.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    return matchesType && matchesStatus && matchesKeyword;
  });

  const typeLabels: Record<string, string> = {
    adjustment: '批号调整',
    alert: '库存预警'
  };

  const adjStatusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成'
  };

  const adjStatusColors: Record<string, 'yellow' | 'green' | 'red' | 'blue'> = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    completed: 'blue'
  };

  const alertStatusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决'
  };

  const alertStatusColors: Record<string, 'yellow' | 'orange' | 'green'> = {
    pending: 'yellow',
    processing: 'orange',
    resolved: 'green'
  };

  const alertLevelLabels: Record<string, string> = {
    red: '红色',
    orange: '橙色',
    yellow: '黄色'
  };

  const columns = [
    { key: 'id', label: '记录编号', width: '100px' },
    { key: 'recordType', label: '记录类型', width: '100px' },
    { key: 'skuName', label: '商品名称', width: '200px' },
    { key: 'content', label: '内容摘要', width: '200px' },
    { key: 'status', label: '状态', width: '80px' },
    { key: 'creator', label: '创建人', width: '100px' },
    { key: 'createTime', label: '创建时间', width: '140px' },
    { key: 'actions', label: '操作', width: '120px' }
  ];

  const tableData = filteredRecords.map(record => {
    const sku = skus.find(s => s.id === record.skuId);
    
    let status: React.ReactNode;
    let content: string;
    let creator: string;

    if (record.recordType === 'adjustment') {
      const adj = record as BatchAdjustment;
      const originalBatch = batches.find(b => b.id === adj.originalBatchId);
      const newBatch = batches.find(b => b.id === adj.newBatchId);
      
      status = <Badge color={adjStatusColors[adj.status]}>{adjStatusLabels[adj.status]}</Badge>;
      content = `${adj.reason}: ${originalBatch?.batchNo} -> ${newBatch?.batchNo} (${adj.adjustQuantity}罐)`;
      creator = adj.applicant;
    } else {
      const alt = record as InventoryAlert;
      status = <Badge color={alertStatusColors[alt.status]}>{alertStatusLabels[alt.status]}</Badge>;
      content = `${alertLevelLabels[alt.alertLevel]}预警: 当前库存${alt.currentStock}低于安全库存${alt.safetyStock}`;
      creator = '系统';
    }

    return {
      id: record.id,
      recordType: typeLabels[record.recordType],
      skuName: sku?.name || '-',
      content,
      status,
      creator,
      createTime: record.createTime,
      actions: (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" onClick={() => { setSelectedRecord(record); setShowTimeline(false); }}>详情</Button>
          <Button size="small" variant="secondary" onClick={() => { setSelectedRecord(record); setShowTimeline(true); }}>追溯</Button>
        </div>
      )
    };
  });

  const recordSummary = {
    adjustment: adjustments.length,
    alert: alerts.length,
    completed: [...adjustments.filter(a => a.status === 'completed'), ...alerts.filter(a => a.status === 'resolved')].length
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>处理记录</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{recordSummary.adjustment}</span>
            <span style={{ color: '#666' }}>批号调整记录</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{recordSummary.alert}</span>
            <span style={{ color: '#666' }}>库存预警记录</span>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{recordSummary.completed}</span>
            <span style={{ color: '#666' }}>已完成记录</span>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索记录编号、商品名称或创建人"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: '全部类型' },
              { value: 'adjustment', label: '批号调整' },
              { value: 'alert', label: '库存预警' }
            ]}
            value={filterType}
            onChange={setFilterType}
          />
          <Select
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'approved', label: '已通过' },
              { value: 'processing', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'resolved', label: '已解决' },
              { value: 'rejected', label: '已驳回' }
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

      {selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '600px', maxHeight: '80vh', overflow: 'auto' }} title={showTimeline ? '追溯链' : '记录详情'}>
            {showTimeline ? (
              <div style={{ paddingLeft: '24px', borderLeft: '2px solid #e8e8e8' }}>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', left: '-29px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4080ff' }} />
                  <p style={{ fontWeight: 'bold' }}>事件起点</p>
                  <p>{selectedRecord.id} 创建于 {'applyTime' in selectedRecord ? selectedRecord.applyTime : selectedRecord.createTime}</p>
                </div>
                
                {'originalBatchId' in selectedRecord && (
                  <>
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-29px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#52c41a' }} />
                      <p style={{ fontWeight: 'bold' }}>审核通过</p>
                      <p>审核人: {selectedRecord.approver || '待审核'}</p>
                      <p>审核时间: {selectedRecord.approveTime || '-'}</p>
                    </div>
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-29px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1890ff' }} />
                      <p style={{ fontWeight: 'bold' }}>库存更新</p>
                      <p>库存数据已联动更新，可能触发预警重评估</p>
                    </div>
                  </>
                )}
                
                {'alertLevel' in selectedRecord && (
                  <>
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-29px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fa8c16' }} />
                      <p style={{ fontWeight: 'bold' }}>预警触发</p>
                      <p>库存低于安全水位阈值</p>
                    </div>
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', left: '-29px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#52c41a' }} />
                      <p style={{ fontWeight: 'bold' }}>处理完成</p>
                      <p>处理人: {selectedRecord.handler || '待处理'}</p>
                      <p>处理结果: {selectedRecord.handleResult || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                {'originalBatchId' in selectedRecord ? (
                  <>
                    <p><strong>记录编号:</strong> {selectedRecord.id}</p>
                    <p><strong>记录类型:</strong> 批号调整</p>
                    <p><strong>商品:</strong> {skus.find(s => s.id === selectedRecord.skuId)?.name}</p>
                    <p><strong>原批号:</strong> {batches.find(b => b.id === selectedRecord.originalBatchId)?.batchNo}</p>
                    <p><strong>新批号:</strong> {batches.find(b => b.id === selectedRecord.newBatchId)?.batchNo}</p>
                    <p><strong>调整数量:</strong> {selectedRecord.adjustQuantity}</p>
                    <p><strong>调整原因:</strong> {selectedRecord.reason}</p>
                    <p><strong>申请人:</strong> {selectedRecord.applicant}</p>
                    <p><strong>申请时间:</strong> {selectedRecord.applyTime}</p>
                    <p><strong>状态:</strong> <Badge color={adjStatusColors[selectedRecord.status]}>{adjStatusLabels[selectedRecord.status]}</Badge></p>
                    {selectedRecord.approver && (
                      <>
                        <p><strong>审核人:</strong> {selectedRecord.approver}</p>
                        <p><strong>审核时间:</strong> {selectedRecord.approveTime}</p>
                      </>
                    )}
                    {selectedRecord.rejectReason && (
                      <p><strong>驳回原因:</strong> {selectedRecord.rejectReason}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p><strong>记录编号:</strong> {selectedRecord.id}</p>
                    <p><strong>记录类型:</strong> 库存预警</p>
                    <p><strong>商品:</strong> {skus.find(s => s.id === selectedRecord.skuId)?.name}</p>
                    <p><strong>当前库存:</strong> {selectedRecord.currentStock}</p>
                    <p><strong>安全库存:</strong> {selectedRecord.safetyStock}</p>
                    <p><strong>预警级别:</strong> <Badge color={alertStatusColors[selectedRecord.alertLevel]}>{alertLevelLabels[selectedRecord.alertLevel]}预警</Badge></p>
                    <p><strong>状态:</strong> <Badge color={alertStatusColors[selectedRecord.status]}>{alertStatusLabels[selectedRecord.status]}</Badge></p>
                    <p><strong>创建时间:</strong> {selectedRecord.createTime}</p>
                    {selectedRecord.handler && (
                      <>
                        <p><strong>处理人:</strong> {selectedRecord.handler}</p>
                        <p><strong>处理时间:</strong> {selectedRecord.handleTime}</p>
                        <p><strong>处理结果:</strong> {selectedRecord.handleResult}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedRecord(null)}>关闭</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
