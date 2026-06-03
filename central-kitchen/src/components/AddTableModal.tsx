import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Radio, Space, message } from 'antd'
import type { Banquet, TableChangeRequest, TableType, LinkageImpact } from '../types'
import { useAppContext } from '../context/AppContext'
import {
  tableTypeNames,
  staffList,
  calculateLinkageImpact,
} from '../data/mockData'
import LinkageStatus from './LinkageStatus'

interface AddTableModalProps {
  open: boolean
  banquet: Banquet | null
  onCancel: () => void
  onSuccess?: () => void
}

const { TextArea } = Input
const { Option } = Select

const AddTableModal: React.FC<AddTableModalProps> = ({ open, banquet, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const { addChangeRequest, updateChangeRequest } = useAppContext()
  const [changeType, setChangeType] = useState<'add_tables' | 'change_table_type'>('add_tables')
  const [newTables, setNewTables] = useState(banquet?.currentTables || 0)
  const [newTableType, setNewTableType] = useState<TableType>(banquet?.tableType || 'adult')
  const [impact, setImpact] = useState<LinkageImpact | null>(null)

  useEffect(() => {
    if (banquet) {
      form.resetFields()
      setNewTables(banquet.currentTables)
      setNewTableType(banquet.tableType)
      setChangeType('add_tables')
      setImpact(null)
    }
  }, [banquet, form, open])

  useEffect(() => {
    if (banquet) {
      const originalTables = changeType === 'add_tables' ? banquet.currentTables : 1
      const tables = changeType === 'add_tables' ? newTables : 1
      const originalType = changeType === 'change_table_type' ? banquet.tableType : banquet.tableType
      const type = changeType === 'change_table_type' ? newTableType : banquet.tableType

      if (changeType === 'add_tables' && newTables > banquet.currentTables) {
        const result = calculateLinkageImpact(
          banquet.currentTables,
          newTables,
          banquet.tableType,
          banquet.tableType,
          banquet.totalAmount,
          banquet.waitersAssigned,
        )
        setImpact({ ...result, kitchenNotified: 'not_notified' })
      } else if (changeType === 'change_table_type' && newTableType !== banquet.tableType) {
        const result = calculateLinkageImpact(
          1,
          1,
          banquet.tableType,
          newTableType,
          banquet.totalAmount,
          banquet.waitersAssigned,
        )
        setImpact({ ...result, kitchenNotified: 'not_notified' })
      } else {
        setImpact(null)
      }
    }
  }, [banquet, changeType, newTables, newTableType])

  const handleSubmit = async () => {
    if (!banquet || !impact) return

    try {
      const values = await form.validateFields()

      const hallManager = staffList.find(s => s.role === 'hall_manager')!

      const request: TableChangeRequest = {
        id: `CR${Date.now()}`,
        banquetId: banquet.id,
        banquetName: banquet.name,
        changeType,
        changeTypeLabel: changeType === 'add_tables'
          ? `加${newTables - banquet.currentTables}桌`
          : `${tableTypeNames[banquet.tableType]}改${tableTypeNames[newTableType]}`,
        originalTables: changeType === 'add_tables' ? banquet.currentTables : 1,
        newTables: changeType === 'add_tables' ? newTables : 1,
        tableCountChange: changeType === 'add_tables' ? newTables - banquet.currentTables : 0,
        originalTableType: changeType === 'change_table_type' ? banquet.tableType : undefined,
        newTableType: changeType === 'change_table_type' ? newTableType : undefined,
        reason: values.reason,
        impact: {
          ...impact,
          kitchenNotified: 'notified',
        },
        status: 'pending_kitchen',
        statusLabel: '待厨房确认',
        applicant: hallManager,
        kitchenNotified: 'notified',
        kitchenNotifiedTime: new Date().toLocaleString('zh-CN'),
        kitchenNotifiedBy: hallManager,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
      }

      addChangeRequest(request)
      message.success('申请已提交，已通知厨房确认')
      onCancel()
      onSuccess?.()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  if (!banquet) return null

  return (
    <Modal
      title={
        <Space>
          <span>发起桌数变更</span>
          <span style={{ fontSize: 14, color: '#888' }}>{banquet.name}</span>
        </Space>
      }
      open={open}
      width={700}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="提交申请"
      cancelText="取消"
      okButtonProps={{ disabled: !impact }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          changeType: 'add_tables',
          reason: '',
        }}
      >
        <Form.Item
          label="变更类型"
          name="changeType"
          rules={[{ required: true, message: '请选择变更类型' }]}
        >
          <Radio.Group onChange={(e) => setChangeType(e.target.value)}>
            <Radio.Button value="add_tables">增加桌数</Radio.Button>
            <Radio.Button value="change_table_type">桌型变更</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {changeType === 'add_tables' ? (
          <Form.Item
            label="调整后桌数"
            name="newTables"
            rules={[
              { required: true, message: '请输入桌数' },
              {
                validator: (_, value) => {
                  if (value <= banquet.currentTables) {
                    return Promise.reject('加桌数量必须大于当前桌数')
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={banquet.currentTables + 1}
              max={50}
              style={{ width: '100%' }}
              addonBefore={`当前 ${banquet.currentTables} 桌`}
              addonAfter={`增加 ${Math.max(0, newTables - banquet.currentTables)} 桌`}
              value={newTables}
              onChange={(value) => setNewTables(value || banquet.currentTables)}
            />
          </Form.Item>
        ) : (
          <Form.Item
            label="新桌型"
            name="newTableType"
            rules={[{ required: true, message: '请选择桌型' }]}
          >
            <Select
              value={newTableType}
              onChange={(value) => setNewTableType(value)}
            >
              {Object.entries(tableTypeNames).map(([key, name]) => (
                <Option key={key} value={key} disabled={key === banquet.tableType}>
                  {name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="变更原因"
          name="reason"
          rules={[{ required: true, message: '请输入变更原因' }]}
        >
          <TextArea
            rows={3}
            placeholder="请详细说明变更原因，如：客人朋友临时到场、儿童改为成人就餐等"
            maxLength={200}
            showCount
          />
        </Form.Item>

        {impact && (
          <LinkageStatus impact={{
            ...impact,
            kitchenNotified: 'not_notified',
          }} />
        )}
      </Form>
    </Modal>
  )
}

export default AddTableModal
