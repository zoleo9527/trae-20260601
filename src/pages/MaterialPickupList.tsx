import { Table, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import { statusDisplayMap, roleDisplayMap } from '@/utils/stateMachine';
import ActionButtons from '@/components/ActionButtons';
import AuditTimeline from '@/components/AuditTimeline';
import type { ColumnsType } from 'antd/es/table';
import type { MaterialPickup } from '@/types';

export default function MaterialPickupList() {
  const api = useApi();
  const workflow = useWorkflow();
  const pickups = api.getMaterialPickups();

  const columns: ColumnsType<MaterialPickup> = [
    {
      title: '领用单号',
      dataIndex: 'pickupNo',
      key: 'pickupNo',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '排产编号',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
    },
    {
      title: '材料明细',
      key: 'items',
      render: (_, record) => (
        <div>
          {record.items.slice(0, 2).map((item, idx) => (
            <div key={idx}>
              {item.materialType} × {item.quantity}
              {item.unit}
            </div>
          ))}
          {record.items.length > 2 && <div>...等{record.items.length}项</div>}
        </div>
      ),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => <strong>¥{v.toFixed(2)}</strong>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={statusDisplayMap[s]?.color}>{statusDisplayMap[s]?.text}</Tag>
      ),
    },
    {
      title: '领用人',
      key: 'operator',
      render: (_, record) => {
        const user = api.getAllUsers().find((u) => u.id === record.pickedBy);
        return user ? `${user.name} (${roleDisplayMap[user.role]})` : record.pickedBy;
      },
    },
    {
      title: '领用时间',
      dataIndex: 'pickedAt',
      key: 'pickedAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>材料领用列表</h2>
      </div>
      <Table
        columns={columns}
        dataSource={pickups}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => {
            const logs = api.getAuditLogsByEntity('material', record.id);
            return (
              <div>
                <h4>材料明细</h4>
                <Table
                  dataSource={record.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '材料类型', dataIndex: 'materialType', key: 'materialType' },
                    { title: '规格', dataIndex: 'specification', key: 'specification' },
                    { title: '单位', dataIndex: 'unit', key: 'unit' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `¥${v}` },
                    { title: '小计', key: 'subtotal', render: (_, r) => `¥${(r.quantity * r.unitPrice).toFixed(2)}` },
                  ]}
                />
                {record.remark && (
                  <p style={{ marginTop: 16 }}>
                    <strong>备注:</strong> {record.remark}
                  </p>
                )}
                <div style={{ marginTop: 16 }}>
                  <h4>可用操作</h4>
                  <ActionButtons
                    actions={workflow.getMaterialPickupAvailableActions(record.status)}
                    onAction={(target) =>
                      workflow.transitionMaterialPickup(record.id, target as any)
                    }
                    entityType="material"
                    entityId={record.id}
                  />
                </div>
                <div style={{ marginTop: 16 }}>
                  <h4>操作留痕</h4>
                  <AuditTimeline logs={logs} />
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
