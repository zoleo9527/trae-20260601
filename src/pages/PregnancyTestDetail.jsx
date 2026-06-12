import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Button, Timeline, Descriptions, Modal, Form, Input, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useGlobalStore } from '../store/GlobalStore'
import { statusMap, resultMap } from '../data/mockData'

function PregnancyTestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tests, updateTestStatus, updateTest } = useGlobalStore()
  const { currentUser, hasPermission } = useApp()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editForm] = Form.useForm()
  
  const test = tests.find(t => t.id === id)

  if (!test) {
    return <div>妊检记录不存在</div>
  }

  const handleReview = () => {
    updateTestStatus(test.id, 'reviewed', currentUser.name, '确认检测结果，等待场长批准')
    message.success('审核成功')
  }

  const handleApprove = () => {
    updateTestStatus(test.id, 'approved', currentUser.name, '同意进入产房安排')
    message.success('批准成功')
  }

  const handleReject = () => {
    Modal.confirm({
      title: '驳回确认',
      content: '请输入驳回原因',
      okText: '确认驳回',
      cancelText: '取消',
      onOk: () => {
        updateTestStatus(test.id, 'rejected', currentUser.name, '检测报告不完整，需要补充资料')
        message.success('驳回成功')
      },
    })
  }

  const handleEdit = () => {
    editForm.setFieldsValue({
      remarks: test.remarks,
    })
    setIsEditModalVisible(true)
  }

  const handleSaveEdit = () => {
    editForm.validateFields().then(values => {
      updateTest(test.id, {
        remarks: values.remarks,
        handler: currentUser.name,
      })
      setIsEditModalVisible(false)
      message.success('编辑成功')
    })
  }

  const handleReset = () => {
    Modal.confirm({
      title: '驳回重提确认',
      content: '确认将此记录重新提交审核？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        updateTestStatus(test.id, 'pending', currentUser.name, '驳回重提，重新提交审核')
        message.success('已重新提交')
      },
    })
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
        返回列表
      </Button>

      <Card title={`妊检详情 - ${test.id}`} style={{ marginBottom: '16px' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="猪只编号">{test.pigId}</Descriptions.Item>
          <Descriptions.Item label="耳号">{test.sowNumber}</Descriptions.Item>
          <Descriptions.Item label="胎次">{test.parity}</Descriptions.Item>
          <Descriptions.Item label="检测日期">{test.testDate}</Descriptions.Item>
          <Descriptions.Item label="检测方法">{test.testMethod}</Descriptions.Item>
          <Descriptions.Item label="检测结果">
            <Tag color={resultMap[test.result]?.color}>{resultMap[test.result]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="预产期">{test.expectedFarrowingDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="检测人">{test.handler}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={statusMap[test.status]?.color}>{statusMap[test.status]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{test.createdAt}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{test.updatedAt}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{test.remarks}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          {hasPermission('pregnancyTest', 'edit') && (
            <Button icon={<EditOutlined />} onClick={handleEdit}>编辑备注</Button>
          )}
          {hasPermission('pregnancyTest', 'review') && test.status === 'pending' && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleReview}>审核</Button>
          )}
          {hasPermission('pregnancyTest', 'approve') && test.status === 'reviewed' && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>批准</Button>
          )}
          {hasPermission('pregnancyTest', 'reject') && test.status !== 'rejected' && test.status !== 'pending' && (
            <Button danger icon={<CloseOutlined />} onClick={handleReject}>驳回</Button>
          )}
          {hasPermission('pregnancyTest', 'create') && test.status === 'rejected' && (
            <Button type="primary" onClick={handleReset}>驳回重提</Button>
          )}
        </div>
      </Card>

      <Card title="操作历史">
        <Timeline>
          {test.history.map((item, index) => (
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

      <Modal
        title="编辑备注"
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleSaveEdit}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PregnancyTestDetail