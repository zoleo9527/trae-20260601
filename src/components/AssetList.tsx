import { SearchOutlined, FilterOutlined, EyeOutlined, EditOutlined, UploadOutlined, Filter } from '@ant-design/icons'
import { Table, Input, Select, Button, Space, Tag } from 'antd'
import { Asset, FilterParams } from '@/types'
import { statusLabels, categories } from '@/data/mockData'

interface AssetListProps {
  assets: Asset[]
  onViewAsset: (assetId: string) => void
  onEditAsset: (assetId: string) => void
  onUploadAttachment: (assetId: string) => void
  onFilterChange: (params: FilterParams) => void
  onFilterApply: () => void
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

export function AssetList({ assets, onViewAsset, onEditAsset, onUploadAttachment, onFilterChange, onFilterApply }: AssetListProps) {
  const handleKeywordChange = (value: string) => {
    onFilterChange(prev => ({ ...prev, keyword: value }))
  }
  const handleStatusChange = (value: string) => {
    onFilterChange(prev => ({ ...prev, status: value || undefined }))
  }
  const handleCategoryChange = (value: string) => {
    onFilterChange(prev => ({ ...prev, category: value || undefined }))
  }
  const handleFilter = () => {
    onFilterApply()
  }

  const columns = [
    {
      title: '标的编号',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '标的名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location',
      width: 80,
    },
    {
      title: '预估价值',
      dataIndex: 'estimatedValue',
      key: 'estimatedValue',
      width: 120,
      render: (value: number) => `${(value / 10000).toFixed(0)}万`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (<Tag color={statusColors[status]}>
        {statusLabels[status]}
      </Tag>),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 100,
      render: (submitter: {
        name: string;
      }) => submitter.name,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: Asset) => (<Space>
        <Button type="text" icon={<EyeOutlined />} onClick={() => onViewAsset(record.id)}>
          查看
        </Button>
        <Button type="text" icon={<EditOutlined />} onClick={() => onEditAsset(record.id)}>
          编辑
        </Button>
        <Button type="text" icon={<UploadOutlined />} onClick={() => onUploadAttachment(record.id)}>
          附件
        </Button>
      </Space>),
    },
  ]

  return (<div className="asset-list">
    <div className="filter-bar">
      <div className="filter-left">
        <Input.Search placeholder="搜索标的名称或编号" allowClear onChange={e => handleKeywordChange(e.target.value)} style={{ width: 300 }}/>
      </div>
      <div className="filter-right">
        <Select placeholder="状态筛选" allowClear style={{ width: 150 }} onChange={handleStatusChange}>
          {Object.entries(statusLabels).map(([value, label]) => (<Select.Option key={value} value={value}>
            {label}
          </Select.Option>))}
        </Select>
        <Select placeholder="类别筛选" allowClear style={{ width: 120 }} onChange={handleCategoryChange}>
          {categories.map(cat => (<Select.Option key={cat} value={cat}>
            {cat}
          </Select.Option>))}
        </Select>
        <Button icon={<Filter />} onClick={handleFilter}>筛选</Button>
      </div>
    </div>
    <Table columns={columns} dataSource={assets} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 1200 }}/>
  </div>)
}
