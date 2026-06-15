import { Button, Dropdown, Space, Modal, Input, Form } from 'antd';
import { useState } from 'react';
import type { StateTransition } from '@/utils/stateMachine';
import type { PrintScheduleStatus } from '@/types';

interface ActionButtonsProps {
  actions: StateTransition[];
  onAction: (targetStatus: string, remark?: string) => boolean;
  entityType: string;
  entityId: string;
  showMaterialDialog?: () => void;
  showInstallTimeDialog?: () => void;
}

export default function ActionButtons({
  actions,
  onAction,
  showMaterialDialog,
  showInstallTimeDialog,
}: ActionButtonsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<StateTransition | null>(null);
  const [form] = Form.useForm();

  const handleClick = (action: StateTransition) => {
    if (action.to === 'material_confirmed' && showMaterialDialog) {
      showMaterialDialog();
      return;
    }
    if (action.to === 'time_changed' && showInstallTimeDialog) {
      showInstallTimeDialog();
      return;
    }
    setSelectedAction(action);
    setModalOpen(true);
  };

  const handleConfirm = () => {
    form.validateFields().then((values) => {
      if (selectedAction) {
        onAction(selectedAction.to as PrintScheduleStatus, values.remark);
        setModalOpen(false);
        form.resetFields();
      }
    });
  };

  if (actions.length === 0) {
    return <span style={{ color: '#999' }}>当前状态无可执行操作</span>;
  }

  return (
    <>
      <Space className="action-buttons">
        {actions.slice(0, 3).map((action) => (
          <Button
            key={action.to}
            type={action.to === 'completed' ? 'primary' : 'default'}
            onClick={() => handleClick(action)}
          >
            {action.label}
          </Button>
        ))}
        {actions.length > 3 && (
          <Dropdown
            menu={{
              items: actions.slice(3).map((action) => ({
                key: action.to,
                label: action.label,
                onClick: () => handleClick(action),
              })),
            }}
          >
            <Button>更多操作</Button>
          </Dropdown>
        )}
      </Space>

      <Modal
        title={selectedAction?.label}
        open={modalOpen}
        onOk={handleConfirm}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
