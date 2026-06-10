import { useState, useEffect } from 'react'
import { Card, Tag, Button, Form, Input, Select, Modal, message, Table, Space } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, CheckOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { BreedingRecord, BreedingNote, NoteStatus, UserRole, CattleNote, BreedingStatus } from '../types'
import { breedingNotesApi, cattleNotesApi, authApi, breedingApi } from '../api'
import { getStatusText, getBreedingTypeText, formatDate, formatDateTime } from '../utils/format'
import { useUserStore } from '../store/userStore'

const { TextArea } = Input
const { Option } = Select

interface BreedingDetailProps {
  record: BreedingRecord
  onBack: () => void
}

export default function BreedingDetail({ record, onBack }: BreedingDetailProps) {
  const [notes, setNotes] = useState<BreedingNote[]>([])
  const [cattleNotes, setCattleNotes] = useState<CattleNote[]>([])
  const [loading, setLoading] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [noteForm] = Form.useForm()
  const [users, setUsers] = useState<{ id: number; name: string; role: UserRole }[]>([])

  const user = useUserStore((state) => state.user)

  useEffect(() => {
    loadNotes()
    loadCattleNotes()
    loadUsers()
  }, [record.id])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const response = await breedingNotesApi.getNotes({ breedingRecordId: record.id })
      setNotes(response.data)
    } catch (error) {
      message.error('加载备注失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCattleNotes = async () => {
    try {
      const response = await cattleNotesApi.getNotes({ cattleId: record.cowId })
      setCattleNotes(response.data)
    } catch (error) {
      message.error('加载牛只备注失败')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await authApi.getUsers()
      setUsers(response.data)
    } catch (error) {
      message.error('加载用户列表失败')
    }
  }

  const handleCreateNote = async (values: {
    content: string
    assigneeId?: number
    relatedCattleNoteId?: number
  }) => {
    try {
      await breedingNotesApi.createNote({
        breedingRecordId: record.id,
        authorId: user!.id,
        content: values.content,
        assigneeId: values.assigneeId,
        relatedCattleNoteId: values.relatedCattleNoteId,
        status: 'pending',
      })
      message.success('添加备注成功')
      setShowNoteModal(false)
      noteForm.resetFields()
      loadNotes()
    } catch (error) {
      message.error('添加备注失败')
    }
  }

  const handleUpdateNoteStatus = async (noteId: number, status: NoteStatus) => {
    try {
      await breedingNotesApi.updateNote(noteId, { status })
      message.success(`备注已${status === 'resolved' ? '解决' : status === 'rejected' ? '退回' : '处理中'}`)
      loadNotes()
    } catch (error) {
      message.error('更新备注状态失败')
    }
  }

  const handleUpdateStatus = async (values: { status: BreedingStatus }) => {
    try {
      await breedingApi.updateRecord(record.id, { status: values.status })
      message.success(`状态已更新为${getStatusText(values.status, 'breeding')}`)
      setShowStatusModal(false)
    } catch (error) {
      message.error('更新状态失败')
    }
  }

  const statusColors: Record<string, string> = {
    planned: 'orange',
    completed: 'blue',
    successful: 'green',
    failed: 'red',
    aborted: 'gray',
  }

  const noteStatusColors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    resolved: 'green',
    rejected: 'red',
  }

  const noteColumns = [
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '关联档案备注',
      dataIndex: 'relatedCattleNote',
      key: 'relatedCattleNote',
      width: 150,
      render: (note: CattleNote | undefined) => (
        note ? (
          <span style={{ color: '#1890ff', cursor: 'pointer' }}>
            查看关联
          </span>
        ) : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={noteStatusColors[status]}>
          {getStatusText(status, 'note')}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assigneeId',
      key: 'assigneeId',
      width: 80,
      render: (id: number | undefined) => users.find((u) => u.id === id)?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '创建人',
      dataIndex: 'author',
      key: 'author',
      width: 80,
      render: (author: { name: string } | undefined) => author?.name || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: BreedingNote) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateNoteStatus(record.id, 'processing')}
            >
              接单
            </Button>
          )}
          {record.status === 'processing' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateNoteStatus(record.id, 'resolved')}
              >
                完成
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleUpdateNoteStatus(record.id, 'rejected')}
              >
                退回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const canAddNote = user?.role === 'manager' || user?.role === 'vet'

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title={`繁育记录详情`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p><strong>母牛：</strong>{record.cow.tagNumber} ({record.cow.breed})</p>
              <p><strong>公牛：</strong>{record.bull.tagNumber} ({record.bull.breed})</p>
              <p><strong>配种方式：</strong>{getBreedingTypeText(record.type)}</p>
              <p><strong>配种日期：</strong>{formatDate(record.breedingDate)}</p>
            </div>
            <div>
              <p><strong>预产期：</strong>{record.expectedCalvingDate ? formatDate(record.expectedCalvingDate) : '-'}</p>
              <p><strong>实际产犊：</strong>{record.actualCalvingDate ? formatDate(record.actualCalvingDate) : '-'}</p>
              <p><strong>犊牛耳标：</strong>{record.calfTagNumber || '-'}</p>
              <p><strong>状态：</strong>
                <Tag color={statusColors[record.status]}>
                  {getStatusText(record.status, 'breeding')}
                </Tag>
              </p>
            </div>
          </div>
          {record.notes && (
            <div style={{ marginTop: 16 }}>
              <p><strong>备注：</strong>{record.notes}</p>
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button type="primary" onClick={() => setShowStatusModal(true)}>
              更新状态
            </Button>
          </div>
        </Card>

        <Card
          title="繁育记录备注"
          extra={canAddNote ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNoteModal(true)}>
              添加备注
            </Button>
          ) : null}
        >
          <Table
            dataSource={notes}
            columns={noteColumns}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />

          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
              <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>暂无备注记录</p>
            </div>
          )}
        </Card>
      </div>

      <Modal
        title="添加繁育备注"
        open={showNoteModal}
        onCancel={() => setShowNoteModal(false)}
        footer={null}
      >
        <Form form={noteForm} onFinish={handleCreateNote} layout="vertical">
          <Form.Item name="content" label="备注内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请输入备注内容" />
          </Form.Item>

          <Form.Item name="relatedCattleNoteId" label="关联档案备注">
            <Select placeholder="选择关联的牛只档案备注">
              <Option value={undefined}>无关联</Option>
              {cattleNotes.map((note) => (
                <Option key={note.id} value={note.id}>
                  [{getBreedingTypeText(note.type)}] {note.content.substring(0, 30)}...
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="assigneeId" label="负责人">
            <Select placeholder="选择负责人">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button onClick={() => setShowNoteModal(false)} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新繁育状态"
        open={showStatusModal}
        onCancel={() => setShowStatusModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="planned">计划中</Option>
              <Option value="completed">已完成</Option>
              <Option value="successful">成功</Option>
              <Option value="failed">失败</Option>
              <Option value="aborted">终止</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              确认更新
            </Button>
            <Button onClick={() => setShowStatusModal(false)} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}