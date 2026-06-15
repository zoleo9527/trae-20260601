import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  message,
  Typography,
  Timeline,
  Divider,
  Row,
  Col,
  Alert,
  Upload,
  List,
  Badge,
  DatePicker,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  UploadOutlined,
  AlertOutlined,
  EditOutlined,
  HistoryOutlined,
  PaperClipOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { UploadProps } from 'antd'
import type { Order, User, Dimension, UserRole } from '../types'
import { orderApi } from '../api'
import { statusMap, roleMap } from '../types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface Props {
  currentUser: User
}

export default function DeviceDetail({ currentUser }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [manuscriptModalVisible, setManuscriptModalVisible] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [colorModalVisible, setColorModalVisible] = useState(false)
  const [installModalVisible, setInstallModalVisible] = useState(false)
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [manuscriptForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [colorForm] = Form.useForm()
  const [installForm] = Form.useForm()
  const [noteForm] = Form.useForm()

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getDetail(id!)
      if (res.data.success) {
        setOrder(res.data.data!)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveManuscript = async (values: any) => {
    try {
      setSubmitting(true)
      const dimension: Dimension = {
        width: values.width,
        height: values.height,
        unit: values.unit,
      }
      const res = await orderApi.receiveManuscript(id!, {
        manuscriptContent: values.manuscriptContent,
        dimension,
        operator: currentUser.name,
        note: values.note,
      })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success(order?.manuscriptReceived ? '稿件已更新，设计师将重新复核' : '稿件已接收')
        setManuscriptModalVisible(false)
        manuscriptForm.resetFields()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewDimension = async (values: any) => {
    try {
      setSubmitting(true)
      const reviewedDimension: Dimension = {
        width: values.width,
        height: values.height,
        unit: values.unit,
      }
      const res = await orderApi.reviewDimension(id!, {
        passed: values.passed,
        reviewedDimension,
        note: values.note,
        operator: currentUser.name,
      })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success(values.passed ? '尺寸复核通过' : '已驳回，待接单员确认')
        setReviewModalVisible(false)
        reviewForm.resetFields()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmColor = async (values: any) => {
    try {
      setSubmitting(true)
      const res = await orderApi.confirmColor(id!, {
        colorRequirement: values.colorRequirement,
        operator: currentUser.name,
      })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success('颜色已确认')
        setColorModalVisible(false)
        colorForm.resetFields()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompletePrint = async () => {
    try {
      setSubmitting(true)
      const res = await orderApi.completePrint(id!, { operator: currentUser.name })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success('喷绘已完成')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateInstall = async (values: any) => {
    try {
      setSubmitting(true)
      const res = await orderApi.updateInstallTime(id!, {
        installTime: values.installTime.toISOString(),
        installAddress: values.installAddress,
        operator: currentUser.name,
        note: values.note,
      })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success('安装信息已更新')
        setInstallModalVisible(false)
        installForm.resetFields()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteInstall = async () => {
    Modal.confirm({
      title: '确认安装完成？',
      content: '确认后订单将进入完成状态',
      onOk: async () => {
        try {
          setSubmitting(true)
          const res = await orderApi.completeInstall(id!, { operator: currentUser.name })
          if (res.data.success) {
            setOrder(res.data.data!)
            message.success('安装已完成')
          }
        } finally {
          setSubmitting(false)
        }
      },
    })
  }

  const handleComplete = async () => {
    Modal.confirm({
      title: '确认订单完成？',
      content: '确认后订单将归档',
      onOk: async () => {
        try {
          setSubmitting(true)
          const res = await orderApi.complete(id!, { operator: currentUser.name })
          if (res.data.success) {
            setOrder(res.data.data!)
            message.success('订单已完成')
          }
        } finally {
          setSubmitting(false)
        }
      },
    })
  }

  const handleAddNote = async (values: any) => {
    try {
      setSubmitting(true)
      const res = await orderApi.addNote(id!, {
        content: values.content,
        operator: currentUser.name,
        role: currentUser.role,
      })
      if (res.data.success) {
        setOrder(res.data.data!)
        message.success('备注已添加')
        setNoteModalVisible(false)
        noteForm.resetFields()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const uploadProps: UploadProps = {
    beforeUpload: async (file) => {
      try {
        const res = await orderApi.addAttachment(id!, {
          name: file.name,
          type: 'other',
          operator: currentUser.name,
        })
        if (res.data.success) {
          message.success('附件已上传（占位）')
          loadOrder()
        }
      } catch {
        message.error('上传失败')
      }
      return false
    },
  }

  const getActionButtons = () => {
    if (!order) return null
    const buttons: JSX.Element[] = []

    if (currentUser.role === 'receiver') {
      if (order.status === 'pending_receipt' || order.status === 'review_rejected') {
        buttons.push(
          <Button type="primary" icon={<FileTextOutlined />} onClick={() => {
            manuscriptForm.setFieldsValue({
              width: order.originalDimension.width,
              height: order.originalDimension.height,
              unit: order.originalDimension.unit,
              manuscriptContent: order.manuscriptContent || '',
            })
            setManuscriptModalVisible(true)
          }}>
            {order.manuscriptReceived ? '修改稿件' : '接收稿件'}
          </Button>
        )
      }
      if (order.status === 'install_completed') {
        buttons.push(
          <Button type="primary" icon={<CheckOutlined />} onClick={handleComplete}>
            完成订单
          </Button>
        )
      }
    }

    if (currentUser.role === 'designer') {
      if ((order.status === 'pending_review' || order.dimensionModified) && order.manuscriptReceived) {
        buttons.push(
          <Button type="primary" icon={order.dimensionModified ? <AlertOutlined /> : <CheckOutlined />} onClick={() => {
            reviewForm.setFieldsValue({
              width: order.originalDimension.width,
              height: order.originalDimension.height,
              unit: order.originalDimension.unit,
              passed: true,
            })
            setReviewModalVisible(true)
          }}>
            {order.dimensionModified ? '尺寸已改，重新复核' : '尺寸复核'}
          </Button>
        )
      }
      if (order.status === 'pending_print') {
        buttons.push(
          <Button type="primary" icon={<EditOutlined />} onClick={() => {
            colorForm.setFieldsValue({
              colorRequirement: order.colorRequirement || '',
            })
            setColorModalVisible(true)
          }}>
            确认颜色 / 开始喷绘
          </Button>
        )
      }
      if (order.status === 'printing') {
        buttons.push(
          <Button type="primary" icon={<CheckOutlined />} onClick={handleCompletePrint}>
            喷绘完成
          </Button>
        )
      }
    }

    if (currentUser.role === 'installer') {
      if (order.status === 'pending_install') {
        buttons.push(
          <Button icon={<EditOutlined />} onClick={() => {
            installForm.setFieldsValue({
              installTime: order.installTime ? dayjs(order.installTime) : null,
              installAddress: order.installAddress || '',
            })
            setInstallModalVisible(true)
          }}>
            更新安装信息
          </Button>
        )
        buttons.push(
          <Button type="primary" icon={<CheckOutlined />} onClick={handleCompleteInstall}>
            安装完成
          </Button>
        )
      }
    }

    buttons.push(
      <Button icon={<PaperClipOutlined />} onClick={() => setNoteModalVisible(true)}>
        添加备注
      </Button>
    )

    return buttons
  }

  const roleIcon = (role: UserRole) => {
    switch (role) {
      case 'receiver': return '📋'
      case 'designer': return '🎨'
      case 'installer': return '🔧'
    }
  }

  if (!order) return null

  return (
    <div className="page-container">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {order.projectName}
          </Title>
          <Tag color={statusMap[order.status].color} style={{ fontSize: 14 }}>
            {statusMap[order.status].text}
          </Tag>
          {order.dimensionModified && (
            <Badge count="尺寸已修改，请复核" color="red" />
          )}
          {order.installTimeModified && (
            <Badge count="安装时间变更" color="orange" />
          )}
          {order.manuscriptVersion > 1 && (
            <Tag color="purple">稿件 v{order.manuscriptVersion}</Tag>
          )}
        </Space>

        {order.dimensionModified && currentUser.role === 'designer' && (
          <Alert
            message="⚠️ 该订单的稿件尺寸已被接单员修改，请重新进行尺寸复核！"
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" danger onClick={() => {
                reviewForm.setFieldsValue({
                  width: order.originalDimension.width,
                  height: order.originalDimension.height,
                  unit: order.originalDimension.unit,
                  passed: true,
                })
                setReviewModalVisible(true)
              }}>
                立即复核
              </Button>
            }
          />
        )}

        {order.installTimeModified && currentUser.role === 'installer' && (
          <Alert
            message="⚠️ 该订单的安装时间已变更，请注意安排！"
            type="warning"
            showIcon
          />
        )}

        <Card
          title="订单信息"
          extra={<Space>{getActionButtons()}</Space>}
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
            <Descriptions.Item label="客户">{order.customerName} ({order.customerPhone})</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="当前处理">
              {roleIcon(order.currentHandler)} {roleMap[order.currentHandler]}
            </Descriptions.Item>
            <Descriptions.Item label="稿件接收" span={2}>
              <Space>
                {order.manuscriptReceived ? (
                  <>
                    <Tag color="green">已接收</Tag>
                    <Text type="secondary">
                      {order.manuscriptReceivedBy} 于 {dayjs(order.manuscriptReceivedAt).format('MM-DD HH:mm')}
                    </Text>
                    <Tag color="purple">v{order.manuscriptVersion}</Tag>
                  </>
                ) : (
                  <Tag color="orange">待接收</Tag>
                )}
              </Space>
            </Descriptions.Item>
            {order.manuscriptContent && (
              <Descriptions.Item label="稿件内容" span={2}>
                <Paragraph style={{ margin: 0 }}>{order.manuscriptContent}</Paragraph>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="原始尺寸" span={2}>
              <Space>
                <Text strong style={{ fontSize: 16 }}>
                  {order.originalDimension.width} × {order.originalDimension.height} {order.originalDimension.unit}
                </Text>
                {order.dimensionModified && <Tag color="red">已修改</Tag>}
              </Space>
            </Descriptions.Item>
            {order.reviewedDimension && (
              <Descriptions.Item label="复核尺寸" span={2}>
                <Space>
                  <Text strong type="success" style={{ fontSize: 16 }}>
                    ✓ {order.reviewedDimension.width} × {order.reviewedDimension.height} {order.reviewedDimension.unit}
                  </Text>
                  <Text type="secondary">
                    {order.dimensionReviewedBy} 于 {dayjs(order.dimensionReviewedAt).format('MM-DD HH:mm')} 复核
                  </Text>
                </Space>
                {order.dimensionReviewNote && (
                  <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                    复核备注：{order.dimensionReviewNote}
                  </Paragraph>
                )}
              </Descriptions.Item>
            )}
            {order.colorRequirement && (
              <Descriptions.Item label="颜色要求" span={2}>
                <Space>
                  <Text>{order.colorRequirement}</Text>
                  {order.colorConfirmed && <Tag color="green">已确认</Tag>}
                </Space>
              </Descriptions.Item>
            )}
            {order.installTime && (
              <Descriptions.Item label="安装时间" span={2}>
                <Space>
                  <Text strong={order.installTimeModified} type={order.installTimeModified ? 'warning' : undefined}>
                    {dayjs(order.installTime).format('YYYY-MM-DD HH:mm')}
                  </Text>
                  {order.installTimeModified && <Tag color="orange">已变更</Tag>}
                </Space>
              </Descriptions.Item>
            )}
            {order.installAddress && (
              <Descriptions.Item label="安装地址" span={2}>
                {order.installAddress}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Row gutter={16}>
          <Col span={14}>
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <span>操作历史</span>
                  <Button type="link" size="small" onClick={() => setHistoryModalVisible(true)}>
                    查看完整历史
                  </Button>
                </Space>
              }
            >
              <Timeline
                items={order.history.slice(-6).reverse().map((h) => ({
                  color: h.action.includes('修改') || h.action.includes('驳回') ? 'red' :
                         h.action.includes('通过') || h.action.includes('完成') ? 'green' :
                         h.action.includes('确认') ? 'blue' : 'gray',
                  children: (
                    <div>
                      <Space>
                        <Text strong>
                          {roleIcon(h.role)} {h.operator}
                        </Text>
                        <Tag>{h.action}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(h.timestamp).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                      <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                        {h.content}
                      </Paragraph>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
          <Col span={10}>
            <Card
              title={
                <Space>
                  <PaperClipOutlined />
                  <span>附件列表</span>
                  <Upload {...uploadProps} showUploadList={false}>
                    <Button size="small" icon={<UploadOutlined />}>上传附件</Button>
                  </Upload>
                </Space>
              }
            >
              {order.attachments.length > 0 ? (
                <List
                  size="small"
                  dataSource={order.attachments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" disabled>
                          下载
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <FileTextOutlined />
                            {item.name}
                            <Tag color={
                              item.type === 'manuscript' ? 'blue' :
                              item.type === 'photo' ? 'green' : 'default'
                            }>
                              {item.type === 'manuscript' ? '稿件' :
                               item.type === 'photo' ? '照片' : '其他'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.uploadedBy} 上传于 {dayjs(item.uploadedAt).format('MM-DD HH:mm')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                  暂无附件
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        title={order.manuscriptReceived ? '修改稿件' : '接收稿件'}
        open={manuscriptModalVisible}
        onCancel={() => setManuscriptModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={manuscriptForm} layout="vertical" onFinish={handleReceiveManuscript}>
          <Form.Item label="稿件内容说明" name="manuscriptContent" rules={[{ required: true, message: '请输入稿件说明' }]}>
            <TextArea rows={3} placeholder="如：PSD文件、300DPI、CMYK模式..." />
          </Form.Item>
          <Divider orientation="left">尺寸信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="宽度" name="width" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} addonAfter="cm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="高度" name="height" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} addonAfter="cm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="单位" name="unit" initialValue="cm">
                <Select>
                  <Option value="cm">厘米 cm</Option>
                  <Option value="mm">毫米 mm</Option>
                  <Option value="m">米 m</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注（可选）" name="note">
            <TextArea rows={2} placeholder="有什么需要特别说明的..." />
          </Form.Item>
          {order.manuscriptReceived && (
            <Alert
              message="修改稿件后，设计师需要重新进行尺寸复核"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {order.manuscriptReceived ? '提交修改' : '确认接收'}
              </Button>
              <Button onClick={() => setManuscriptModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={order.dimensionModified ? '重新复核尺寸（有修改）' : '尺寸复核'}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Alert
          message={
            <Space>
              <AlertOutlined />
              原始订单尺寸：{order.originalDimension.width} × {order.originalDimension.height} {order.originalDimension.unit}
              {order.manuscriptVersion > 1 && <Tag color="purple">稿件 v{order.manuscriptVersion}</Tag>}
            </Space>
          }
          type={order.dimensionModified ? 'error' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewDimension}>
          <Divider orientation="left">请核对设计稿实际尺寸</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="宽度" name="width" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} addonAfter="cm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="高度" name="height" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} addonAfter="cm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="单位" name="unit" initialValue="cm">
                <Select>
                  <Option value="cm">厘米 cm</Option>
                  <Option value="mm">毫米 mm</Option>
                  <Option value="m">米 m</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="复核结果" name="passed" rules={[{ required: true }]}>
            <Select>
              <Option value={true}>✓ 尺寸正确，通过</Option>
              <Option value={false}>✗ 尺寸有误，驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item label="复核备注" name="note" rules={[{ required: true, message: '请填写复核意见' }]}>
            <TextArea rows={3} placeholder="如：尺寸正确，喷绘材质520灯布，注意底部留空..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交复核结果
              </Button>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认颜色要求 / 开始喷绘"
        open={colorModalVisible}
        onCancel={() => setColorModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={colorForm} layout="vertical" onFinish={handleConfirmColor}>
          <Form.Item label="颜色要求说明" name="colorRequirement" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="如：深色背景，色值#0A1A2F，色彩均匀无明显色差，符合品牌VI标准..." />
          </Form.Item>
          <Alert
            message="确认后将进入喷绘环节，请仔细核对颜色要求"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认并开始喷绘
              </Button>
              <Button onClick={() => setColorModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新安装信息"
        open={installModalVisible}
        onCancel={() => setInstallModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={installForm} layout="vertical" onFinish={handleUpdateInstall}>
          <Form.Item label="安装时间" name="installTime" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item label="安装地址" name="installAddress" rules={[{ required: true }]}>
            <Input placeholder="请输入详细安装地址" />
          </Form.Item>
          <Form.Item label="变更说明" name="note">
            <TextArea rows={2} placeholder="如果是时间变更，请说明原因..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认更新
              </Button>
              <Button onClick={() => setInstallModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加备注"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
          <Form.Item label="备注内容" name="content" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="输入备注内容..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                添加
              </Button>
              <Button onClick={() => setNoteModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完整操作历史"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={700}
      >
        <Timeline
          items={[...order.history].reverse().map((h) => ({
            color: h.action.includes('修改') || h.action.includes('驳回') ? 'red' :
                   h.action.includes('通过') || h.action.includes('完成') ? 'green' :
                   h.action.includes('确认') ? 'blue' : 'gray',
            children: (
              <div>
                <Space>
                  <Text strong>
                    {roleIcon(h.role)} {h.operator} ({roleMap[h.role]})
                  </Text>
                  <Tag>{h.action}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(h.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                </Space>
                <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                  {h.content}
                </Paragraph>
              </div>
            ),
          }))}
        />
      </Modal>
    </div>
  )
}
