import { Modal, Form, Table, Input, InputNumber, Button, Space, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { MaterialItem } from '@/types';
import { useWorkflow } from '@/hooks/useWorkflow';

interface MaterialPickupDialogProps {
  open: boolean;
  onCancel: () => void;
  scheduleId: string;
  onSuccess: () => void;
}

export default function MaterialPickupDialog({
  open,
  onCancel,
  scheduleId,
  onSuccess,
}: MaterialPickupDialogProps) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<MaterialItem[]>([
    {
      id: 'new-1',
      materialType: '',
      specification: '',
      unit: '平方米',
      quantity: 0,
      unitPrice: 0,
    },
  ]);
  const workflow = useWorkflow();

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `new-${Date.now()}`,
        materialType: '',
        specification: '',
        unit: '平方米',
        quantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof MaterialItem, value: unknown) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleOk = () => {
    const validItems = items.filter(
      (i) => i.materialType && i.quantity > 0 && i.unitPrice > 0
    );
    if (validItems.length === 0) {
      return;
    }

    const success = workflow.createMaterialPickupForSchedule(scheduleId, validItems);
    if (success) {
      workflow.transitionSchedule(scheduleId, 'material_confirmed');
      onSuccess();
      onCancel();
      setItems([
        {
          id: 'new-1',
          materialType: '',
          specification: '',
          unit: '平方米',
          quantity: 0,
          unitPrice: 0,
        },
      ]);
    }
  };

  const columns = [
    {
      title: '材料类型',
      dataIndex: 'materialType',
      render: (_: unknown, record: MaterialItem) => (
        <Select
          value={record.materialType}
          onChange={(v: string) => updateItem(record.id, 'materialType', v)}
          style={{ width: 150 }}
          options={[
            { value: '户外背胶', label: '户外背胶' },
            { value: '相纸', label: '相纸' },
            { value: '灯箱片', label: '灯箱片' },
            { value: '550喷绘布', label: '550喷绘布' },
            { value: '过膜', label: '过膜' },
            { value: '打扣', label: '打扣' },
          ]}
        />
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      render: (_: unknown, record: MaterialItem) => (
        <Input
          value={record.specification}
          onChange={(e) => updateItem(record.id, 'specification', e.target.value)}
          placeholder="如：1.52m宽"
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      render: (_: unknown, record: MaterialItem) => (
        <Select
          value={record.unit}
          onChange={(v: string) => updateItem(record.id, 'unit', v)}
          style={{ width: 100 }}
          options={[
            { value: '平方米', label: '平方米' },
            { value: '个', label: '个' },
            { value: '米', label: '米' },
          ]}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      render: (_: unknown, record: MaterialItem) => (
        <InputNumber
          value={record.quantity}
          onChange={(v) => updateItem(record.id, 'quantity', v || 0)}
          min={0}
          step={0.1}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '单价(元)',
      dataIndex: 'unitPrice',
      render: (_: unknown, record: MaterialItem) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(v) => updateItem(record.id, 'unitPrice', v || 0)}
          min={0}
          step={0.01}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '小计(元)',
      dataIndex: 'subtotal',
      render: (_: unknown, record: MaterialItem) => (
        <span>{(record.quantity * record.unitPrice).toFixed(2)}</span>
      ),
    },
    {
      title: '操作',
      render: (_: unknown, record: MaterialItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.id)}
        />
      ),
    },
  ];

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );

  return (
    <Modal
      title="登记材料领用"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确认领用"
      cancelText="取消"
      width={900}
    >
      <div style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={addItem}>
          添加材料
        </Button>
      </div>
      <Table
        dataSource={items}
        columns={columns}
        pagination={false}
        rowKey="id"
      />
      <div style={{ textAlign: 'right', marginTop: 16, fontSize: 16, fontWeight: 'bold' }}>
        合计: ¥{total.toFixed(2)}
      </div>
    </Modal>
  );
}
