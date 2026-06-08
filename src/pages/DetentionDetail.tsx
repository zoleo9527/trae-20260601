import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card, Descriptions, Tabs, Table, Tag, Timeline, Button, Modal, Form,
  Input, Radio, Result, message, Space, Alert,
} from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchDetention, submitSupplementary, submitReview, submitResult } from '../api'
import { DETAIN_REASON_LABELS } from '../types'
import type { Detention, SuppDoc, Review } from '../types'
import StatusBadge from '../components/StatusBadge'

const ORIGINAL_DOC_STATUS_MAP: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'green' },
  missing: { label: '缺失', color: 'red' },
  missing_page: { label: '缺页', color: 'red' },
  expired: { label: '过期', color: 'orange' },
  mismatch: { label: '不符', color: 'red' },
}

const REVIEW_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'orange' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
}

export default function DetentionDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Detention | null>(null)
  const [loading, setLoading] = useState(false)
  const [suppModalOpen, setSuppModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<'released' | 'returned'>('released')
  const [submitting, setSubmitting] = useState(false)

  const [suppForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [resultForm] = Form.useForm()

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetchDetention(id)
      setData(res)
    } catch {
      message.error('获取详情失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSuppSubmit = async (values: { docName: string; uploadedBy: string; fileName: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await submitSupplementary(id, values)
      message.success('补证材料提交成功')
      setSuppModalOpen(false)
      suppForm.resetFields()
      loadData()
    } catch {
      message.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewSubmit = async (values: { reviewer: string; opinion: 'approve' | 'reject'; comment: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await submitReview(id, values)
      message.success('复核意见提交成功')
      setReviewModalOpen(false)
      reviewForm.resetFields()
      loadData()
    } catch {
      message.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResultSubmit = async (values: { operator: string; comment: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await submitResult(id, { result: resultType, ...values })
      message.success('处理结果已确认')
      setResultModalOpen(false)
      resultForm.resetFields()
      loadData()
    } catch {
      message.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !data) {
    return <Card loading={loading} />
  }

  const canSubmitSupp = data.status === 'detained' || data.status === 'supplementing'
  const canSubmitReview = data.status === 'reviewing'
  const canSubmitResult = data.status === 'reviewing' && !data.finalResult

  const submittedDocNames = new Set(data.supplementaryDocs.map((d) => d.docName))
  const unsubmittedRequiredDocs = data.requiredDocs.filter((d) => !submittedDocNames.has(d.docName))

  const originalDocColumns = [
    { title: '单证名称', dataIndex: 'docName', key: 'docName' },
    { title: '单证编号', dataIndex: 'docNo', key: 'docNo' },
    { title: '签发日期', dataIndex: 'issueDate', key: 'issueDate', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const info = ORIGINAL_DOC_STATUS_MAP[v]
        return info ? <Tag color={info.color}>{info.label}</Tag> : <Tag>{v}</Tag>
      },
    },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ]

  const requiredDocColumns = [
    { title: '材料名称', dataIndex: 'docName', key: 'docName' },
    { title: '具体要求', dataIndex: 'description', key: 'description' },
    { title: '是否必须', dataIndex: 'isRequired', key: 'isRequired', render: (v: boolean) => v ? <Tag color="red">必须</Tag> : <Tag>可选</Tag> },
    {
      title: '提交状态', dataIndex: 'docName', key: 'submitStatus',
      render: (docName: string) => submittedDocNames.has(docName)
        ? <Tag color="green">已提交</Tag>
        : <Tag color="orange">未提交</Tag>,
    },
  ]

  const suppDocColumns = [
    { title: '材料名称', dataIndex: 'docName', key: 'docName' },
    { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '上传人', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
    {
      title: '审核状态', dataIndex: 'reviewStatus', key: 'reviewStatus',
      render: (v: string) => {
        const info = REVIEW_STATUS_MAP[v]
        return info ? <Tag color={info.color}>{info.label}</Tag> : <Tag>{v}</Tag>
      },
    },
    { title: '审核意见', dataIndex: 'reviewComment', key: 'reviewComment' },
  ]

  const tabItems = [
    {
      key: 'detain',
      label: '扣留信息',
      children: (
        <>
          <Card title="扣留详情" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="扣留原因">{DETAIN_REASON_LABELS[data.detainReason]}</Descriptions.Item>
              <Descriptions.Item label="扣留依据">{data.detainBasis}</Descriptions.Item>
              <Descriptions.Item label="安检员">{data.inspector}</Descriptions.Item>
              <Descriptions.Item label="受理人员">{data.receiver}</Descriptions.Item>
              <Descriptions.Item label="库区影响说明" span={2}>{data.warehouseImpact || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="原始单证" style={{ marginBottom: 16 }}>
            <Table rowKey="docNo" columns={originalDocColumns} dataSource={data.originalDocs} pagination={false} size="small" />
          </Card>
          <Card title="必补材料清单">
            <Table rowKey="id" columns={requiredDocColumns} dataSource={data.requiredDocs} pagination={false} size="small" />
          </Card>
        </>
      ),
    },
    {
      key: 'supplement',
      label: '补证材料',
      children: (
        <>
          {unsubmittedRequiredDocs.length > 0 && canSubmitSupp && (
            <Alert
              style={{ marginBottom: 16 }}
              type="warning"
              showIcon
              message="以下材料仍需补交"
              description={unsubmittedRequiredDocs.map((d) => d.docName).join('、')}
            />
          )}
          <Card
            title="已提交补证材料"
            extra={canSubmitSupp && (
              <Button type="primary" onClick={() => setSuppModalOpen(true)}>提交补证材料</Button>
            )}
          >
            <Table rowKey="id" columns={suppDocColumns} dataSource={data.supplementaryDocs} pagination={false} size="small" />
          </Card>
        </>
      ),
    },
    {
      key: 'review',
      label: '复核意见',
      children: (
        <>
          <Card
            title="复核记录"
            extra={canSubmitReview && (
              <Button type="primary" onClick={() => setReviewModalOpen(true)}>提交复核意见</Button>
            )}
          >
            {data.reviews.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>暂无复核意见</div>
            ) : (
              <Timeline
                items={data.reviews.map((r: Review) => ({
                  color: r.opinion === 'approve' ? 'green' : 'red',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {r.reviewer}
                        <Tag color={r.opinion === 'approve' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                          {r.opinion === 'approve' ? '通过' : '不通过'}
                        </Tag>
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>{dayjs(r.reviewTime).format('YYYY-MM-DD HH:mm')}</div>
                      {r.comment && <div style={{ marginTop: 4 }}>{r.comment}</div>}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </>
      ),
    },
    {
      key: 'result',
      label: '处理结果',
      children: (
        <Card title="处理结果">
          {data.finalResult ? (
            <>
              <Result
                status={data.finalResult === 'released' ? 'success' : 'error'}
                title={data.finalResult === 'released' ? '已放行' : '已退回'}
                subTitle={
                  <Descriptions column={1} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="处理时间">{data.finalResultTime ? dayjs(data.finalResultTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="操作人">{data.finalResultBy}</Descriptions.Item>
                    <Descriptions.Item label="处理说明">{data.finalResultComment || '-'}</Descriptions.Item>
                  </Descriptions>
                }
              />
            </>
          ) : canSubmitResult ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ fontSize: 16, marginBottom: 24 }}>当前状态可确认最终处理结果</p>
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => { setResultType('released'); setResultModalOpen(true) }}
                >
                  确认放行
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => { setResultType('returned'); setResultModalOpen(true) }}
                >
                  确认退回
                </Button>
              </Space>
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>暂无处理结果</div>
          )}
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered>
          <Descriptions.Item label="运单号">{data.waybillNo}</Descriptions.Item>
          <Descriptions.Item label="货物品名">{data.goodsName}</Descriptions.Item>
          <Descriptions.Item label="申报品名">{data.declaredGoodsName}</Descriptions.Item>
          <Descriptions.Item label="货物编码">{data.goodsCode}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusBadge status={data.status} /></Descriptions.Item>
          <Descriptions.Item label="扣留时间">{dayjs(data.detainTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="detain" items={tabItems} />

      <Modal
        title="提交补证材料"
        open={suppModalOpen}
        onCancel={() => { setSuppModalOpen(false); suppForm.resetFields() }}
        onOk={() => suppForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={suppForm} layout="vertical" onFinish={handleSuppSubmit}>
          <Form.Item name="docName" label="材料名称" rules={[{ required: true, message: '请输入材料名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="uploadedBy" label="上传人" rules={[{ required: true, message: '请输入上传人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fileName" label="文件名" rules={[{ required: true, message: '请输入文件名' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交复核意见"
        open={reviewModalOpen}
        onCancel={() => { setReviewModalOpen(false); reviewForm.resetFields() }}
        onOk={() => reviewForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item name="reviewer" label="复核人" rules={[{ required: true, message: '请输入复核人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="opinion" label="意见" rules={[{ required: true, message: '请选择意见' }]}>
            <Radio.Group>
              <Radio value="approve">通过</Radio>
              <Radio value="reject">不通过</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="comment" label="意见说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={resultType === 'released' ? '确认放行' : '确认退回'}
        open={resultModalOpen}
        onCancel={() => { setResultModalOpen(false); resultForm.resetFields() }}
        onOk={() => resultForm.submit()}
        confirmLoading={submitting}
        okButtonProps={{ danger: resultType === 'returned' }}
      >
        <Form form={resultForm} layout="vertical" onFinish={handleResultSubmit}>
          <Form.Item name="operator" label="操作人" rules={[{ required: true, message: '请输入操作人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="comment" label="处理说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
