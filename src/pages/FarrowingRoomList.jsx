import { useState } from 'react'
import { Table, Tag, Button, Input, Space, Modal, Form, message, Card } from 'antd'
import { EyeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { farrowingRooms as initialRooms, pregnancyTests } from '../data/mockData'

function FarrowingRoomList() {
  const [rooms, setRooms] = useState(initialRooms)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { currentUser, hasPermission } = useAuth()

  const availableTests = pregnancyTests.filter(t => t.status === 'approved' && !t.farrowingRoomId)

  const filteredRooms = rooms.filter(room =>
    room.roomNumber.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleView = (id) => {
    navigate(`/farrowing-room/${id}`)
  }

  const showCreateModal = () => {
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      const newRoom = {
        id: `FR${String(rooms.length + 1).padStart(3, '0')}`,
        roomNumber: values.roomNumber,
        bedCount: values.bedCount,
        occupiedBeds: 0,
        status: 'empty',
        statusDesc: '空闲',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        history: [
          {
            time: new Date().toLocaleString('zh-CN'),
            action: '创建产房',
            operator: currentUser.name,
            remark: `新建${values.roomNumber}`,
          },
        ],
        assignments: [],
      }
      setRooms([newRoom, ...rooms])
      setIsModalVisible(false)
      message.success('创建成功')
    })
  }

  const showAssignModal = (roomId) => {
    setSelectedRoomId(roomId)
    form.resetFields()
    setIsAssignModalVisible(true)
  }

  const handleAssign = () => {
    form.validateFields().then(values => {
      const room = rooms.find(r => r.id === selectedRoomId)
      const test = pregnancyTests.find(t => t.id === values.pregnancyTestId)
      
      if (!room || !test) return

      const newAssignment = {
        id: `FA${String(Date.now()).slice(-3)}`,
        pregnancyTestId: test.id,
        pigId: test.pigId,
        sowNumber: test.sowNumber,
        expectedFarrowingDate: test.expectedFarrowingDate,
        bedNumber: values.bedNumber,
        status: 'pending',
        statusDesc: '待确认',
        handler: currentUser.name,
        handlerId: currentUser.id,
        remarks: `妊检备注：${test.remarks}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        history: [
          {
            time: new Date().toLocaleString('zh-CN'),
            action: '创建安排',
            operator: currentUser.name,
            remark: `安排${test.sowNumber}到${room.roomNumber}${values.bedNumber}号床位`,
          },
        ],
      }

      setRooms(rooms.map(r => {
        if (r.id === selectedRoomId) {
          return {
            ...r,
            occupiedBeds: r.occupiedBeds + 1,
            status: r.occupiedBeds + 1 >= r.bedCount ? 'full' : 'normal',
            statusDesc: r.occupiedBeds + 1 >= r.bedCount ? '已满' : '正常使用',
            updatedAt: new Date().toLocaleString('zh-CN'),
            history: [
              ...r.history,
              {
                time: new Date().toLocaleString('zh-CN'),
                action: '安排母猪',
                operator: currentUser.name,
                remark: `安排${test.sowNumber}进入产房`,
              },
            ],
            assignments: [...r.assignments, newAssignment],
          }
        }
        return r
      }))
      
      setIsAssignModalVisible(false)
      message.success('安排成功')
    })
  }

  const statusColors = {
    normal: 'green',
    empty: 'blue',
    full: 'red',
  }

  const columns = [
    {
      title: '产房编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '产房名称',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: '床位总数',
      dataIndex: 'bedCount',
      key: 'bedCount',
    },
    {
      title: '已占用床位',
      dataIndex: 'occupiedBeds',
      key: 'occupiedBeds',
    },
    {
      title: '剩余床位',
      key: 'availableBeds',
      render: (_, record) => record.bedCount - record.occupiedBeds,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text, record) => (
        <Tag color={statusColors[text] || 'gray'}>
          {record.statusDesc}
        </Tag>
      ),
    },
    {
      title: '安排数量',
      key: 'assignmentCount',
      render: (_, record) => record.assignments.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
          {hasPermission('farrowingRoom', 'assign') && record.occupiedBeds < record.bedCount && (
            <Button type="primary" onClick={() => showAssignModal(record.id)}>安排母猪</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <Input
          placeholder="搜索产房名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        {hasPermission('farrowingRoom', 'create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            新增产房
          </Button>
        )}
      </div>

      <Card title="待安排的已确认妊检记录" style={{ marginBottom: '16px' }}>
        {availableTests.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {availableTests.map(test => (
              <div key={test.id} style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined />
                  <span><strong>{test.sowNumber}</strong></span>
                  <span style={{ color: '#666' }}>{test.pigId}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                  预产期：{test.expectedFarrowingDate} | 备注：{test.remarks}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            暂无待安排的妊检记录
          </div>
        )}
      </Card>

      <Table
        columns={columns}
        dataSource={filteredRooms}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增产房"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleCreate}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="roomNumber" label="产房名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="bedCount" label="床位数量" rules={[{ required: true, type: 'number' }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="安排母猪到产房"
        visible={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        onOk={handleAssign}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="pregnancyTestId" label="选择妊检记录" rules={[{ required: true }]}>
            <Select
              options={availableTests.map(test => ({
                value: test.id,
                label: `${test.sowNumber} - ${test.pigId} (预产期: ${test.expectedFarrowingDate})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="bedNumber" label="床位号" rules={[{ required: true, type: 'number' }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FarrowingRoomList