import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Select, Button, Card, Space, Divider, message } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { createDetention } from '../api'
import { DETAIN_REASON_LABELS } from '../types'
import type { DetainReason } from '../types'

export default function DetentionRegister() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values: {
    waybillNo: string
    goodsName: string
    declaredGoodsName: string
    goodsCode: string
    detainReason: DetainReason
    detainBasis: string
    inspector: string
    receiver: string
    warehouseImpact: string
    requiredDocs: { docName: string; description: string; isRequired: boolean }[]
  }) => {
    setSubmitting(true)
    try {
      await createDetention({
        ...values,
        requiredDocs: values.requiredDocs ?? [],
        originalDocs: [],
      })
      message.success('扣留登记创建成功')
      navigate('/')
    } catch {
      message.error('创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="新建扣留登记">
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 800 }}>
        <Form.Item name="waybillNo" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="goodsName" label="货物品名" rules={[{ required: true, message: '请输入货物品名' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="declaredGoodsName" label="申报品名" rules={[{ required: true, message: '请输入申报品名' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="goodsCode" label="货物编码" rules={[{ required: true, message: '请输入货物编码' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="detainReason" label="扣留原因" rules={[{ required: true, message: '请选择扣留原因' }]}>
          <Select
            options={Object.entries(DETAIN_REASON_LABELS).map(([value, label]) => ({ value, label }))}
            placeholder="请选择扣留原因"
          />
        </Form.Item>
        <Form.Item name="detainBasis" label="扣留依据" rules={[{ required: true, message: '请输入扣留依据' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="inspector" label="安检员" rules={[{ required: true, message: '请输入安检员' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="receiver" label="受理人员" rules={[{ required: true, message: '请输入受理人员' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="warehouseImpact" label="库区影响说明">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Divider>必补单证材料</Divider>

        <Form.List name="requiredDocs">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'docName']} rules={[{ required: true, message: '请输入材料名称' }]}>
                    <Input placeholder="材料名称" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'description']}>
                    <Input placeholder="具体要求说明" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'isRequired']} valuePropName="checked" initialValue={true}>
                    <Select style={{ width: 100 }} options={[{ value: true, label: '必须' }, { value: false, label: '可选' }]} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                添加必补材料
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交登记
            </Button>
            <Button onClick={() => navigate('/')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
