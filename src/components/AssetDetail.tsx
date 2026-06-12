import { useState, useEffect } from 'react'
import { XOutlined, FileTextOutlined, UserOutlined, CalendarOutlined, MessageOutlined, UploadOutlined } from '@ant-design/icons'
import { Modal, Tabs, Tag, Button, Form, Input, Upload, Row, Col, Space } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { Asset, FlowRecord, Attachment, UserRole } from '@/types'
import { statusLabels, roleLabels } from '@/data/mockData'
interface AssetDetailProps {
  asset: Asset | undefined
  flowRecords: FlowRecord[]
  attachments: Attachment[]
  visible: boolean
  activeTab?: string
  onClose: () => void
  onSubmitReview: (assetId: string, status: string, comment: string) => void
  onSubmitFinance: (assetId: string, status: string, comment: string) => void
  userRole: UserRole
}
const statusColors: Record<string, string> = {
 pending_entry: 'orange',
 entry_completed: 'blue',
 pending_review: 'cyan',
 review_approved: 'green',
 review_rejected: 'red',
 pending_finance: 'gold',
 finance_approved: 'green',
 finance_rejected: 'red',
 completed: 'gray',
}
export function AssetDetail({ asset, flowRecords, attachments, visible, activeTab: defaultTab, onClose, onSubmitReview, onSubmitFinance, userRole }: AssetDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [visible, defaultTab])
 const handleSubmit = (status: string) => {
 const values = form.getFieldsValue()
 const comment = values.comment || ''
 if (userRole === 'reviewer') {
 onSubmitReview(asset!.id, status, comment)
 } else if (userRole === 'finance') {
 onSubmitFinance(asset!.id, status, comment)
 }
 form.resetFields()
 onClose()
 }
 const canReview = userRole === 'reviewer' && asset?.status === 'pending_review'
 const canFinance = userRole === 'finance' && asset?.status === 'pending_finance'
 const formatValue = (value: number) => `${(value / 10000).toFixed(2)}万元`
 return (<Modal title="标的详情" open={visible} onCancel={onClose} width={900} footer={null} closeIcon={<XOutlined/>}>
 {asset ? (<Tabs activeKey={activeTab} onChange={setActiveTab}>
 <Tabs.TabPane tab="基本信息" key="info">
 <div className="asset-info">
 <Row gutter={16}>
 <Col span={12}>
 <div className="info-item">
 <UserOutlined/>
<span className="label">标的编号</span>
 <span className="value">{asset.code}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <Tag color={statusColors[asset.status]}>
 {statusLabels[asset.status]}
 </Tag>
 </div>
 </Col>
 <Col span={24}>
 <div className="info-item">
 <FileTextOutlined/>
<span className="label">标的名称</span>
 <span className="value">{asset.name}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <FileTextOutlined/>
<span className="label">类别</span>
 <span className="value">{asset.category}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <FileTextOutlined/>
<span className="label">所在地</span>
 <span className="value">{asset.location}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <span className="label">预估价值</span>
 <span className="value highlight">{formatValue(asset.estimatedValue)}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <CalendarOutlined/>
<span className="label">创建时间</span>
 <span className="value">{asset.createdAt}</span>
 </div>
 </Col>
 <Col span={12}>
 <div className="info-item">
 <UserOutlined/>
<span className="label">提交人</span>
 <span className="value">{asset.submitter.name} ({roleLabels[asset.submitter.role]})</span>
 </div>
 </Col>
 {asset.reviewer && (<Col span={12}>
 <div className="info-item">
 <UserOutlined/>
<span className="label">审核人</span>
 <span className="value">{asset.reviewer.name} ({roleLabels[asset.reviewer.role]})</span>
 </div>
 </Col>)}
 {asset.financeHandler && (<Col span={12}>
 <div className="info-item">
 <UserOutlined/>
<span className="label">财务处理人</span>
 <span className="value">{asset.financeHandler.name} ({roleLabels[asset.financeHandler.role]})</span>
 </div>
 </Col>)}
 </Row>
 </div>
 {(canReview || canFinance) && (<div className="review-section">
 <h4>{canReview ? '审核处理' : '财务处理'}</h4>
 <Form form={form}>
 <Form.Item name="comment" label="处理意见">
 <TextArea rows={3} placeholder="请输入处理意见..."/>
 </Form.Item>
 <Space>
 {canReview && (<>
 <Button type="primary" onClick={() => handleSubmit('review_approved')}>
 审核通过
 </Button>
 <Button danger onClick={() => handleSubmit('review_rejected')}>
 审核驳回
 </Button>
 </>)}
 {canFinance && (<>
 <Button type="primary" onClick={() => handleSubmit('finance_approved')}>
 财务通过
 </Button>
 <Button danger onClick={() => handleSubmit('finance_rejected')}>
 财务驳回
 </Button>
 </>)}
 </Space>
 </Form>
 </div>)}
 </Tabs.TabPane>

 <Tabs.TabPane tab="流转记录" key="flow">
 <div className="flow-list">
 {flowRecords.length > 0 ? (flowRecords.map((record, index) => (<div key={record.id} className="flow-item">
 <div className="flow-line">
 {index < flowRecords.length - 1 && <div className="line"/>}
 </div>
 <div className="flow-content">
 <div className="flow-header">
 <Tag color={statusColors[record.statusTo]}>
 {statusLabels[record.statusTo]}
 </Tag>
 <span className="flow-time">{record.handledAt}</span>
 </div>
 <div className="flow-handler">
<UserOutlined/>
<span>{record.handler.name} ({roleLabels[record.handler.role]})</span>
</div>
<div className="flow-comment">
<MessageOutlined/>
 <span>{record.comment}</span>
 </div>
 </div>
 </div>))) : (<div className="empty-flow">暂无流转记录</div>)}
 </div>
 </Tabs.TabPane>

 <Tabs.TabPane tab="附件资料" key="attachments">
 <div className="attachment-list">
 {attachments.length > 0 ? (attachments.map(att => (<div key={att.id} className="attachment-item">
 <FileTextOutlined className="attachment-icon"/>
 <div className="attachment-info">
 <span className="attachment-name">{att.name}</span>
 <span className="attachment-meta">
 {att.uploadedBy.name} · {att.uploadedAt} · {(att.size / 1024).toFixed(1)}KB
 </span>
 </div>
 <Button type="text">下载</Button>
 </div>))) : (<div className="empty-attachments">暂无附件</div>)}
 <Upload.Dragger className="upload-area">
 <p className="ant-upload-icon">
 <UploadOutlined/>
 </p>
 <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
 </Upload.Dragger>
 </div>
 </Tabs.TabPane>
 </Tabs>) : (<div className="empty-asset">未找到标的信息</div>)}
 </Modal>)
}

