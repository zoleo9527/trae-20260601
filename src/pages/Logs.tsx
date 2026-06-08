import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { Table, Tag, Input, Select, DatePicker, Space } from 'antd'
import dayjs from 'dayjs'
import { useLogStore } from '@/stores/logStore'
import type { OperationLog, ActionType, EntityType } from '@/types'

const ACTION_LABELS: Record<ActionType, string> = {
  create: '创建',
  edit: '编辑',
  depart: '确认出车',
  return: '确认回车',
  settle: '标记结算',
  approve: '审核通过',
  reject: '驳回',
  resubmit: '重新提交',
  supplement: '补录排班',
  exception_mark: '标记异常',
}

const ACTION_COLORS: Record<ActionType, string> = {
  create: 'blue',
  edit: 'default',
  depart: 'orange',
  return: 'green',
  settle: 'green',
  approve: 'green',
  reject: 'red',
  resubmit: 'blue',
  supplement: 'orange',
  exception_mark: 'gold',
}

const ENTITY_LABELS: Record<EntityType, string> = {
  schedule: '排班',
  settlement: '结算',
  exception: '异常',
}

const ENTITY_PATH_MAP: Record<EntityType, string> = {
  schedule: '/schedule',
  settlement: '/settlement',
  exception: '/exception',
}

const ROLE_LABELS: Record<string, string> = {
  dispatcher: '调度员',
  fleet_manager: '车队管理员',
  finance: '财务结算员',
  supervisor: '运营主管',
}

const FIELD_LABELS: Record<string, string> = {
  status: '状态',
  tripNo: '行程单号',
  isSupplement: '是否补录',
  totalFee: '合计费用',
  reason: '原因',
  description: '描述',
  type: '类型',
  actualReturn: '实际返回时间',
}

function DiffDisplay({
  before,
  after,
}: {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}) {
  const allKeys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  )

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'boolean') return val ? '是' : '否'
    return String(val)
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2 border-b pb-1">
          变更前
        </div>
        {before === null ? (
          <Tag>新建</Tag>
        ) : (
          allKeys.map((key) => {
            const changed = after && JSON.stringify(before[key]) !== JSON.stringify(after[key])
            return (
              <div
                key={key}
                className={`text-xs py-1 px-2 rounded ${changed ? 'bg-red-50' : ''}`}
              >
                <span className="text-gray-400">{FIELD_LABELS[key] || key}：</span>
                <span className="text-gray-700">
                  {formatValue(before[key])}
                </span>
              </div>
            )
          })
        )}
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2 border-b pb-1">
          变更后
        </div>
        {after === null ? (
          <span className="text-xs text-gray-400">-</span>
        ) : (
          allKeys.map((key) => {
            const changed = before && JSON.stringify(before[key]) !== JSON.stringify(after[key])
            return (
              <div
                key={key}
                className={`text-xs py-1 px-2 rounded ${changed ? 'bg-green-50' : ''}`}
              >
                <span className="text-gray-400">{FIELD_LABELS[key] || key}：</span>
                <span className="text-gray-700">
                  {formatValue(after[key])}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function Logs() {
  const navigate = useNavigate()
  const logs = useLogStore((s) => s.logs)

  const [actionFilter, setActionFilter] = useState<ActionType | undefined>()
  const [entityFilter, setEntityFilter] = useState<EntityType | undefined>()
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const filteredLogs = useMemo(() => {
    let result = [...logs]

    if (actionFilter) {
      result = result.filter((log) => log.action === actionFilter)
    }

    if (entityFilter) {
      result = result.filter((log) => log.entityType === entityFilter)
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      result = result.filter(
        (log) =>
          log.entityId.toLowerCase().includes(kw) ||
          log.operator.toLowerCase().includes(kw)
      )
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day')
      const end = dateRange[1].endOf('day')
      result = result.filter((log) => {
        const d = dayjs(log.operatedAt)
        return d.isAfter(start) && d.isBefore(end)
      })
    }

    result.sort((a, b) => dayjs(b.operatedAt).valueOf() - dayjs(a.operatedAt).valueOf())

    return result
  }, [logs, actionFilter, entityFilter, keyword, dateRange])

  const columns = [
    {
      title: '时间',
      dataIndex: 'operatedAt',
      key: 'operatedAt',
      width: 150,
      render: (val: string) => (
        <span className="text-gray-500">{dayjs(val).format('MM-DD HH:mm')}</span>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 90,
      render: (val: string) => <span className="font-medium text-[#1a2332]">{val}</span>,
    },
    {
      title: '角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 100,
      render: (val: string) => (
        <span className="text-xs text-gray-500">{ROLE_LABELS[val] ?? val}</span>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (val: ActionType) => (
        <Tag color={ACTION_COLORS[val]}>{ACTION_LABELS[val]}</Tag>
      ),
    },
    {
      title: '对象',
      key: 'entity',
      width: 160,
      render: (_: unknown, record: OperationLog) => (
        <div className="flex items-center gap-1.5">
          <Tag className="text-xs">{ENTITY_LABELS[record.entityType]}</Tag>
          <a
            onClick={() => navigate(ENTITY_PATH_MAP[record.entityType])}
            className="text-[#e67e22] hover:text-[#d35400] text-xs font-medium"
          >
            {record.entityId}
          </a>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-[#1a2332]" />
        <h1 className="text-lg font-semibold text-[#1a2332] m-0">操作日志</h1>
        <span className="text-xs text-gray-400">共{logs.length}条记录</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">操作类型</span>
            <Select
              value={actionFilter}
              onChange={setActionFilter}
              allowClear
              placeholder="全部"
              style={{ width: 130 }}
              options={Object.entries(ACTION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">对象类型</span>
            <Select
              value={entityFilter}
              onChange={setEntityFilter}
              allowClear
              placeholder="全部"
              style={{ width: 100 }}
              options={Object.entries(ENTITY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">搜索</span>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="对象ID / 操作人"
              style={{ width: 180 }}
              allowClear
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">时间范围</span>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 240 }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <Table<OperationLog>
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          bordered
          size="middle"
          pagination={{ pageSize: 15 }}
          expandable={{
            expandedRowRender: (record) => (
              <DiffDisplay
                before={record.beforeValue}
                after={record.afterValue}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
