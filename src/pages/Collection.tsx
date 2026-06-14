import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message } from 'antd'
import type { CollectionRecord, LoanApplication } from '@/types'

interface CollectionProps {
  collectionRecords: CollectionRecord[]
  applications: LoanApplication[]
  onAddRecord: (record: Omit<CollectionRecord, 'id'>) => void
}

export function Collection({ collectionRecords, applications, onAddRecord }: CollectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 120,
      render: (text: string) => {
        const app = applications.find(a => a.id === text)
        return app ? `${text} (${app.applicantName})` : text
      },
    },
    {
      title: '联系时间',
      dataIndex: 'contactTime',
      key: 'contactTime',
      width: 160,
    },
    {
      title: '联系结果',
      dataIndex: 'contactResult',
      key: 'contactResult',
      width: 100,
      render: (text: string) => (
        <Tag color={text === 'success' ? 'success' : text === 'failed' ? 'error' : 'warning'}>
          {text === 'success' ? '成功' : text === 'failed' ? '失败' : '待跟进'}
        </Tag>
      ),
    },
    {
      title: '催收人',
      dataIndex: 'collector',
      key: 'collector',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ]

  const handleAddRecord = async () => {
    try {
      const values = await form.validateFields()
      onAddRecord({
        applicationId: values.applicationId,
        contactTime: new Date().toLocaleString('zh-CN'),
        contactResult: values.contactResult,
        collector: values.collector,
        note: values.note,
      })
      form.resetFields()
      setShowAddModal(false)
      message.success('催收记录添加成功')
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>催收记录</h2>
        <Button type="primary" onClick={() => setShowAddModal(true)}>
          添加催收记录
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={collectionRecords}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="添加催收记录"
        visible={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onOk={handleAddRecord}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="applicationId" label="申请编号" rules={[{ required: true }]}>
            <Select
              options={applications.map(a => ({ value: a.id, label: `${a.id} - ${a.applicantName}` }))}
            />
          </Form.Item>
          <Form.Item name="contactResult" label="联系结果" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'success', label: '成功' },
                { value: 'failed', label: '失败' },
                { value: 'pending', label: '待跟进' },
              ]}
            />
          </Form.Item>
          <Form.Item name="collector" label="催收人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
