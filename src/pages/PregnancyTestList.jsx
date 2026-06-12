import { useState } from 'react'
import { Table, Tag, Button, Input, Select, Space, Modal, Form, message } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePregnancyTestStore } from '../store/useStore'
import { statusMap, resultMap } from '../data/mockData'

function PregnancyTestList() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { currentUser, hasPermission } = useAuth()
  const { tests, addTest, updateTestStatus } = usePregnancyTestStore()

  const filteredTests = tests.filter(test => {
    const matchSearch = test.sowNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                       test.pigId.toLowerCase().includes(searchText.toLowerCase())
    const matchStatus = !statusFilter || test.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleView = (id) => {
    navigate(`/pregnancy-test/${id}`)
  }

  const handleReview = (record) => {
    updateTestStatus(record.id, 'approved', currentUser.name, '确认检测结果')
    message.success('审核成功')
  }

  const handleApprove = (record) => {
    updateTestStatus(record.id, 'approved', currentUser.name, '同意进入产房安排')
    message.success('批准成功')
  }

  const handleReject = (record) => {
    Modal.confirm({
      title: '驳回确认',
      content: '请输入驳回原因',
      okText: '确认驳回',
      cancelText: '取消',
      onOk: () => {
        updateTestStatus(record.id, 'rejected', currentUser.name, '检测报告不完整，需要补充资料')
        message.success('驳回成功')
      },
    })
  }

  const showCreateModal = () => {
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      addTest({
        pigId: values.pigId,
        sowNumber: values.sowNumber,
        parity: values.parity,
        testDate: values.testDate,
        testMethod: values.testMethod,
        result: values.result,
        resultDesc: values.result === 'positive' ? '已怀孕' : '未怀孕',
        expectedFarrowingDate: values.result === 'positive' ? values.expectedFarrowingDate : null,
        handler: currentUser.name,
        handlerId: currentUser.id,
        remarks: values.remarks,
        status: 'pending',
        statusDesc: '待审核',
        farrowingRoomId: null,
      })
      setIsModalVisible(false)
      message.success('创建成功')
    })
  }

  const columns = [
    {
      title: '妊检编号',
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
      title: '胎次',
      dataIndex: 'parity',
      key: 'parity',
    },
    {
      title: '检测日期',
      dataIndex: 'testDate',
      key: 'testDate',
    },
    {
      title: '检测方法',
      dataIndex: 'testMethod',
      key: 'testMethod',
    },
    {
      title: '检测结果',
      dataIndex: 'result',
      key: 'result',
      render: (text) => (
        <Tag color={resultMap[text]?.color || 'gray'}>
          {resultMap[text]?.label || text}
        </Tag>
      ),
    },
    {
      title: '预产期',
      dataIndex: 'expectedFarrowingDate',
      key: 'expectedFarrowingDate',
    },
    {
      title: '检测人',
      dataIndex: 'handler',
      key: 'handler',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={statusMap[text]?.color || 'gray'}>
          {statusMap[text]?.label || text}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
          {hasPermission('pregnancyTest', 'review') && record.status === 'pending' && (
            <Button icon={<CheckOutlined />} onClick={() => handleReview(record)}>审核</Button>
          )}
          {hasPermission('pregnancyTest', 'approve') && record.status === 'pending' && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>批准</Button>
          )}
          {hasPermission('pregnancyTest', 'reject') && record.status !== 'rejected' && (
            <Button danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>驳回</Button>
          )}
          {hasPermission('pregnancyTest', 'edit') && (
            <Button icon={<EditOutlined />}>编辑</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <Input
          placeholder="搜索耳号或猪只编号"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="按状态筛选"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: '', label: '全部' },
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已确认' },
            { value: 'rejected', label: '已驳回' },
          ]}
        />
        {hasPermission('pregnancyTest', 'create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            新增妊检结果
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredTests}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增妊检结果"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleCreate}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="pigId" label="猪只编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sowNumber" label="耳号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parity" label="胎次" rules={[{ required: true, type: 'number' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="testDate" label="检测日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="testMethod" label="检测方法" rules={[{ required: true }]}>
            <Select options={[
              { value: 'B超检测', label: 'B超检测' },
              { value: '激素检测', label: '激素检测' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="result" label="检测结果" rules={[{ required: true }]}>
            <Select options={[
              { value: 'positive', label: '已怀孕' },
              { value: 'negative', label: '未怀孕' },
            ]} />
          </Form.Item>
          <Form.Item name="expectedFarrowingDate" label="预产期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PregnancyTestList