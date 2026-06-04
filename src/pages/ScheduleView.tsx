import { useEffect, useState } from 'react'
import { Card, Table, DatePicker, Button, Space, Tag, message } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { commonApi } from '../services/api'
import { ScheduleVO } from '../types'

const { RangePicker } = DatePicker

export default function ScheduleView() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<ScheduleVO[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week')
  ])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await commonApi.getSchedules(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      )
      setSchedules(data)
    } catch (error) {
      message.error('加载排班数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [dateRange])

  const handleExport = async () => {
    try {
      const result = await commonApi.exportSchedules()
      message.success(result || '导出成功')
    } catch (error: any) {
      message.error(error.message || '导出失败')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'surgeryDate',
      key: 'surgeryDate',
      width: 120,
      render: (date: string) => dayjs(date).format('MM月DD日 ddd')
    },
    {
      title: '时间',
      key: 'time',
      width: 150,
      render: (_: any, record: ScheduleVO) => (
        <span>{record.startTime} - {record.endTime}</span>
      )
    },
    {
      title: '手术室',
      dataIndex: 'operatingRoom',
      key: 'operatingRoom',
      width: 100
    },
    {
      title: '流程编号',
      dataIndex: 'workflowNo',
      key: 'workflowNo',
      width: 130
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100
    },
    {
      title: '手术类型',
      dataIndex: 'surgeryTypeName',
      key: 'surgeryTypeName',
      width: 120
    },
    {
      title: '主刀医生',
      dataIndex: 'surgeonName',
      key: 'surgeonName',
      width: 100,
      render: (name: string | null) => name || '-'
    },
    {
      title: '耗材清单',
      dataIndex: 'materialList',
      key: 'materialList',
      ellipsis: true
    }
  ]

  const groupedData = schedules.reduce((acc, curr) => {
    const date = curr.surgeryDate
    if (!acc[date]) acc[date] = []
    acc[date].push(curr)
    return acc
  }, {} as Record<string, ScheduleVO[]>)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回工作面板
          </Button>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出排班表
          </Button>
        </Space>
      </Card>

      <Card title="手术排班表 - 周视图">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={schedules}
          loading={loading}
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <p style={{ margin: 0 }}>
                耗材：{record.materialList || '无特殊要求'}
              </p>
            )
          }}
        />
      </Card>

      <Card title="按日期分组" style={{ marginTop: 16 }}>
        {Object.entries(groupedData).map(([date, items]) => (
          <Card
            key={date}
            size="small"
            title={`${dayjs(date).format('YYYY年MM月DD日 dddd')} (${items.length}台手术)`}
            style={{ marginBottom: 12 }}
          >
            <Space wrap>
              {items.map(item => (
                <Tag key={item.id} color="blue" style={{ padding: '8px 16px' }}>
                  <div>{item.startTime} - {item.endTime}</div>
                  <div><strong>{item.patientName}</strong></div>
                  <div>{item.surgeryTypeName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{item.operatingRoom}</div>
                </Tag>
              ))}
            </Space>
          </Card>
        ))}
      </Card>
    </div>
  )
}
