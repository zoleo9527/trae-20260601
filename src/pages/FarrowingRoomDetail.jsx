import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Button, Timeline, Descriptions, Table } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { farrowingRooms as initialRooms } from '../data/mockData'

function FarrowingRoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rooms] = useState(initialRooms)
  const { currentUser, hasPermission } = useAuth()
  
  const room = rooms.find(r => r.id === id)

  if (!room) {
    return <div>产房不存在</div>
  }

  const statusColors = {
    normal: 'green',
    empty: 'blue',
    full: 'red',
  }

  const assignmentColumns = [
    {
      title: '安排编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '猪只编号',
      dataIndex: 'pigId',
      key: 'pigId',
    },
    {
      title: '耳号',
      dataIndex: 'sowNumber',
      key: 'sowNumber',
    },
    {
      title: '床位号',
      dataIndex: 'bedNumber',
      key: 'bedNumber',
    },
    {
      title: '预产期',
      dataIndex: 'expectedFarrowingDate',
      key: 'expectedFarrowingDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text, record) => (
        <Tag color={text === 'confirmed' ? 'green' : 'orange'}>
          {record.statusDesc}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'handler',
      key: 'handler',
    },
    {
      title: '妊检备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
        返回列表
      </Button>

      <Card title={`产房详情 - ${room.roomNumber}`} style={{ marginBottom: '16px' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="产房编号">{room.id}</Descriptions.Item>
          <Descriptions.Item label="产房名称">{room.roomNumber}</Descriptions.Item>
          <Descriptions.Item label="床位总数">{room.bedCount}</Descriptions.Item>
          <Descriptions.Item label="已占用床位">{room.occupiedBeds}</Descriptions.Item>
          <Descriptions.Item label="剩余床位">{room.bedCount - room.occupiedBeds}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={statusColors[room.status] || 'gray'}>{room.statusDesc}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{room.createdAt}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{room.updatedAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="床位安排列表" style={{ marginBottom: '16px' }}>
        {room.assignments.length > 0 ? (
          <Table
            columns={assignmentColumns}
            dataSource={room.assignments}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            暂无床位安排
          </div>
        )}
      </Card>

      <Card title="产房操作历史">
        <Timeline>
          {room.history.map((item, index) => (
            <Timeline.Item key={index}>
              <div>
                <strong>{item.action}</strong>
                <span style={{ marginLeft: '16px', color: '#666' }}>{item.time}</span>
              </div>
              <div style={{ marginTop: '8px', color: '#888' }}>
                操作人：{item.operator}
              </div>
              <div style={{ marginTop: '4px', color: '#888' }}>
                备注：{item.remark}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  )
}

export default FarrowingRoomDetail