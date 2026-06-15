import { useState } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button, Card, Input, Select, Table, Badge } from './common';
import { adjustReasons } from '../data/mockData';
import { BatchAdjustment } from '../types';

export function BatchAdjustmentPage() {
  const { adjustments, skus, batches, addAdjustment, approveAdjustment, rejectAdjustment, completeAdjustment, currentRole } = useWorkbench();
  const [showForm, setShowForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formData, setFormData] = useState({
    skuId: '',
    originalBatchId: '',
    newBatchId: '',
    adjustQuantity: '',
    reason: '临期下架'
  });
  const [selectedAdjustment, setSelectedAdjustment] = useState<BatchAdjustment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const filteredAdjustments = adjustments.filter(adj => {
    const matchesStatus = !filterStatus || adj.status === filterStatus;
    const sku = skus.find(s => s.id === adj.skuId);
    const matchesKeyword = !searchKeyword || 
      adj.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      sku?.name.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesStatus && matchesKeyword;
  });

  const handleSubmit = () => {
    if (!formData.skuId || !formData.originalBatchId || !formData.newBatchId || !formData.adjustQuantity) {
      alert('请填写完整信息');
      return;
    }

    const originalBatch = batches.find(b => b.id === formData.originalBatchId);
    if (!originalBatch || originalBatch.quantity < parseInt(formData.adjustQuantity)) {
      alert('原批次库存不足');
      return;
    }

    const now = new Date().toLocaleString('zh-CN');
    addAdjustment({
      skuId: formData.skuId,
      originalBatchId: formData.originalBatchId,
      newBatchId: formData.newBatchId,
      adjustQuantity: parseInt(formData.adjustQuantity),
      reason: formData.reason,
      applicant: currentRole === 'clerk' ? '张三' : '测试用户',
      applyTime: now,
      createTime: now,
      status: 'pending',
      attachments: []
    });

    setFormData({
      skuId: '',
      originalBatchId: '',
      newBatchId: '',
      adjustQuantity: '',
      reason: '临期下架'
    });
    setShowForm(false);
  };

  const handleApprove = () => {
    if (selectedAdjustment) {
      approveAdjustment(selectedAdjustment.id, '王经理');
      setSelectedAdjustment(null);
    }
  };

  const handleReject = () => {
    if (selectedAdjustment && rejectReason) {
      rejectAdjustment(selectedAdjustment.id, '王经理', rejectReason);
      setSelectedAdjustment(null);
      setRejectReason('');
      setShowRejectModal(false);
    }
  };

  const handleComplete = () => {
    if (selectedAdjustment) {
      completeAdjustment(selectedAdjustment.id);
      setSelectedAdjustment(null);
    }
  };

  const skuBatches = (skuId: string) => batches.filter(b => b.skuId === skuId);

  const statusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成'
  };

  const statusColors: Record<string, 'yellow' | 'green' | 'red' | 'blue'> = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    completed: 'blue'
  };

  const columns = [
    { key: 'id', label: '申请单号', width: '100px' },
    { key: 'skuName', label: '商品名称', width: '200px' },
    { key: 'originalBatch', label: '原批号', width: '120px' },
    { key: 'newBatch', label: '新批号', width: '120px' },
    { key: 'adjustQuantity', label: '调整数量', width: '100px' },
    { key: 'reason', label: '调整原因', width: '120px' },
    { key: 'applicant', label: '申请人', width: '100px' },
    { key: 'applyTime', label: '申请时间', width: '140px' },
    { key: 'status', label: '状态', width: '80px' },
    { key: 'actions', label: '操作', width: '150px' }
  ];

  const tableData = filteredAdjustments.map(adj => {
    const sku = skus.find(s => s.id === adj.skuId);
    const originalBatch = batches.find(b => b.id === adj.originalBatchId);
    const newBatch = batches.find(b => b.id === adj.newBatchId);
    return {
      id: adj.id,
      skuName: sku?.name || '-',
      originalBatch: originalBatch?.batchNo || '-',
      newBatch: newBatch?.batchNo || '-',
      adjustQuantity: adj.adjustQuantity,
      reason: adj.reason,
      applicant: adj.applicant,
      applyTime: adj.applyTime,
      status: <Badge color={statusColors[adj.status]}>{statusLabels[adj.status]}</Badge>,
      actions: (
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentRole === 'manager' && adj.status === 'pending' && (
            <>
              <Button size="small" onClick={(e?: React.MouseEvent<HTMLButtonElement>) => { e?.stopPropagation(); setSelectedAdjustment(adj); }}>审核</Button>
            </>
          )}
          {currentRole === 'manager' && adj.status === 'approved' && (
            <Button size="small" variant="success" onClick={(e?: React.MouseEvent<HTMLButtonElement>) => { e?.stopPropagation(); setSelectedAdjustment(adj); }}>完成</Button>
          )}
          {currentRole === 'clerk' && adj.status === 'rejected' && (
            <Button size="small" variant="secondary" onClick={(e?: React.MouseEvent<HTMLButtonElement>) => { e?.stopPropagation(); }}>修改</Button>
          )}
        </div>
      )
    };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>批号处理</h2>
        {(currentRole === 'clerk' || currentRole === 'manager') && (
          <Button onClick={() => setShowForm(true)}>新建调整申请</Button>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索申请单号或商品名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待审核' },
              { value: 'approved', label: '已通过' },
              { value: 'rejected', label: '已驳回' },
              { value: 'completed', label: '已完成' }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          {selectedItems.length > 0 && (
            <Button variant="secondary" onClick={() => setSelectedItems([])}>
              取消选择 ({selectedItems.length})
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

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }} title="新建批号调整申请">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>商品 SKU</label>
                <Select
                  options={skus.map(s => ({ value: s.id, label: s.name }))}
                  value={formData.skuId}
                  onChange={(v) => {
                    setFormData(prev => ({ ...prev, skuId: v, originalBatchId: '', newBatchId: '' }));
                  }}
                  placeholder="请选择商品"
                />
              </div>
              <div>
                <label>原批号</label>
                <Select
                  options={skuBatches(formData.skuId).map(b => ({ value: b.id, label: `${b.batchNo} (库存: ${b.quantity})` }))}
                  value={formData.originalBatchId}
                  onChange={(v) => setFormData(prev => ({ ...prev, originalBatchId: v }))}
                  placeholder="请选择原批号"
                />
              </div>
              <div>
                <label>新批号</label>
                <Select
                  options={skuBatches(formData.skuId).filter(b => b.id !== formData.originalBatchId).map(b => ({ value: b.id, label: `${b.batchNo} (库存: ${b.quantity})` }))}
                  value={formData.newBatchId}
                  onChange={(v) => setFormData(prev => ({ ...prev, newBatchId: v }))}
                  placeholder="请选择新批号"
                />
              </div>
              <div>
                <label>调整数量</label>
                <Input
                  type="number"
                  placeholder="请输入调整数量"
                  value={formData.adjustQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustQuantity: e.target.value }))}
                />
              </div>
              <div>
                <label>调整原因</label>
                <Select
                  options={adjustReasons.map(r => ({ value: r, label: r }))}
                  value={formData.reason}
                  onChange={(v) => setFormData(prev => ({ ...prev, reason: v }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
                <Button onClick={handleSubmit}>提交</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedAdjustment && !showRejectModal && selectedAdjustment.status === 'pending' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '500px' }} title="审核批号调整申请">
            <div style={{ marginBottom: '16px' }}>
              <p><strong>申请单号:</strong> {selectedAdjustment.id}</p>
              <p><strong>商品:</strong> {skus.find(s => s.id === selectedAdjustment.skuId)?.name}</p>
              <p><strong>原批号:</strong> {batches.find(b => b.id === selectedAdjustment.originalBatchId)?.batchNo}</p>
              <p><strong>新批号:</strong> {batches.find(b => b.id === selectedAdjustment.newBatchId)?.batchNo}</p>
              <p><strong>调整数量:</strong> {selectedAdjustment.adjustQuantity}</p>
              <p><strong>调整原因:</strong> {selectedAdjustment.reason}</p>
              <p><strong>申请人:</strong> {selectedAdjustment.applicant}</p>
              <p><strong>申请时间:</strong> {selectedAdjustment.applyTime}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedAdjustment(null)}>关闭</Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>驳回</Button>
              <Button onClick={handleApprove}>通过</Button>
            </div>
          </Card>
        </div>
      )}

      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '400px' }} title="驳回申请">
            <div style={{ marginBottom: '16px' }}>
              <label>驳回原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因"
                style={{ width: '100%', height: '100px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => { setShowRejectModal(false); setSelectedAdjustment(null); }}>取消</Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>确认驳回</Button>
            </div>
          </Card>
        </div>
      )}

      {selectedAdjustment && selectedAdjustment.status === 'approved' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '400px' }} title="确认完成调整">
            <p>确认已完成批号调整操作？完成后将更新库存数据并联动刷新预警状态。</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setSelectedAdjustment(null)}>取消</Button>
              <Button variant="success" onClick={handleComplete}>确认完成</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
