import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { DataTable } from '@/components/common/DataTable';
import { OPERATION_TYPE_LABELS, USER_ROLE_LABELS, type OperationType } from '@/types';
import { formatDateTime, getOperationTypeColor } from '@/utils/formatters';

export function HistoryPage() {
  const { students, users, loadStudents, loadUsers, getAllLogs } = useStore();
  const [keyword, setKeyword] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  const logs = getAllLogs({
    operatorId: operatorFilter || undefined,
    operationType: typeFilter ? [typeFilter] : undefined,
  }).map((log) => {
    const student = students.find((s) => s.id === log.studentId);
    const operator = users.find((u) => u.id === log.operatorId);
    return {
      ...log,
      student,
      operator,
    };
  });

  const filteredLogs = logs.filter((log) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      log.student?.name.toLowerCase().includes(kw) ||
      log.student?.studentNo.toLowerCase().includes(kw) ||
      log.operator?.name.toLowerCase().includes(kw)
    );
  });

  const columns = [
    {
      key: 'operatedAt',
      title: '操作时间',
      width: '160px',
      render: (item: any) => (
        <span className="text-sm text-gray-600 font-mono">
          {formatDateTime(item.operatedAt)}
        </span>
      ),
    },
    {
      key: 'student',
      title: '学员',
      render: (item: any) => (
        <div>
          <div className="font-medium">{item.student?.name || '-'}</div>
          <div className="text-xs text-gray-500">{item.student?.studentNo || '-'}</div>
        </div>
      ),
    },
    {
      key: 'operationType',
      title: '操作类型',
      width: '100px',
      render: (item: any) => (
        <span className={`status-badge ${getOperationTypeColor(item.operationType)}`}>
          {OPERATION_TYPE_LABELS[item.operationType as OperationType]}
        </span>
      ),
    },
    {
      key: 'operator',
      title: '操作人',
      width: '100px',
      render: (item: any) => (
        <div>
          <div className="text-sm">{item.operator?.name || '-'}</div>
          <div className="text-xs text-gray-500">
            {USER_ROLE_LABELS[item.operator?.role as keyof typeof USER_ROLE_LABELS] || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'changeContent',
      title: '变更内容',
      render: (item: any) => {
        if (item.operationType === 'CREATE') {
          return <span className="text-sm text-gray-600">新增学员记录</span>;
        }
        if (item.operationType === 'STATUS_CHANGE') {
          const before = item.beforeValue?.status || '';
          const after = item.afterValue?.status || '';
          return (
            <span className="text-sm text-gray-600">
              {before} → {after}
            </span>
          );
        }
        if (item.beforeValue && item.afterValue) {
          const keys = Object.keys(item.afterValue).filter(
            (k) => item.beforeValue?.[k] !== item.afterValue?.[k]
          );
          if (keys.length === 0) return <span className="text-sm text-gray-400">-</span>;
          return (
            <div className="text-sm text-gray-600">
              {keys.map((k) => (
                <div key={k}>
                  {k}: {String(item.beforeValue?.[k] || '-')} →{' '}
                  {String(item.afterValue?.[k] || '-')}
                </div>
              ))}
            </div>
          );
        }
        if (item.afterValue) {
          return (
            <span className="text-sm text-gray-600">
              {Object.keys(item.afterValue)
                .slice(0, 2)
                .join(', ')}
            </span>
          );
        }
        return <span className="text-sm text-gray-400">-</span>;
      },
    },
    {
      key: 'changeReason',
      title: '变更原因',
      render: (item: any) => (
        <span className="text-sm text-gray-500">
          {item.changeReason || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '详情',
      width: '80px',
      render: (_item: any) => (
        <button className="text-sm text-primary-600 hover:text-primary-700">
          查看
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">操作历史</h1>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名、编号、操作人..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">全部操作人</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">全部类型</option>
            {Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{logs.length}</div>
            <div className="text-sm text-gray-500">总记录数</div>
          </div>
          <div className="p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600">
              {logs.filter((l) => l.operationType === 'CREATE').length}
            </div>
            <div className="text-sm text-success-600">新增</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter((l) => l.operationType === 'UPDATE' || l.operationType === 'STATUS_CHANGE').length}
            </div>
            <div className="text-sm text-blue-600">更新</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {logs.filter((l) => l.operationType === 'TRAINING_UPDATE').length}
            </div>
            <div className="text-sm text-amber-600">训练更新</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLogs}
          emptyMessage="暂无操作记录"
        />
      </div>
    </div>
  );
}
