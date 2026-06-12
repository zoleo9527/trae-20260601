import { XOutlined } from '@ant-design/icons'
import { Modal, Form, Input, Select, Button, Row, Col, Upload } from 'antd'
import { User } from '@/types'
import { categories } from '@/data/mockData'

interface AssetEntryProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: AssetEntryData) => void
  currentUser: User
}

interface AssetEntryData {
  name: string
  code: string
  category: string
  location: string
  estimatedValue: string
}

export function AssetEntry({ visible, onClose, onSubmit, currentUser }: AssetEntryProps) {
  const [form] = Form.useForm()

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSubmit(values as AssetEntryData)
      form.resetFields()
      onClose()
    })
  }

  return (
    <Modal
      title="标的入库"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      closeIcon={<XOutlined />}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="标的编号"
              rules={[{ required: true, message: '请输入标的编号' }]}
            >
              <Input placeholder="如：BJ-CY-2024-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="标的类别"
              rules={[{ required: true, message: '请选择类别' }]}
            >
              <Select placeholder="请选择类别">
                {categories.map(cat => (
                  <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="name"
          label="标的名称"
          rules={[{ required: true, message: '请输入标的名称' }]}
        >
          <Input placeholder="请输入标的名称" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="location"
              label="所在地"
              rules={[{ required: true, message: '请输入所在地' }]}
            >
              <Select placeholder="请选择所在地">
                <Select.Option value="北京">北京</Select.Option>
                <Select.Option value="上海">上海</Select.Option>
                <Select.Option value="广州">广州</Select.Option>
                <Select.Option value="深圳">深圳</Select.Option>
                <Select.Option value="其他">其他</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="estimatedValue"
              label="预估价值（万元）"
              rules={[{ required: true, message: '请输入预估价值' }]}
            >
              <Input placeholder="请输入预估价值" />
            </Form.Item>
          </Col>
        </Row>

        <div className="upload-section">
          <p>上传标的资料</p>
          <Upload.Dragger>
            <p className="ant-upload-text">点击或拖拽文件到此处上传（标的资料、竞买保证金、成交确认书等）</p>
          </Upload.Dragger>
        </div>

        <div className="form-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">
            提交入库
          </Button>
        </div>
      </Form>
    </Modal>
  )
}