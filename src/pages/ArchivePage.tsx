import { useEffect, useState } from 'react';
import { CheckCircle, Clock, X, Edit2, Save, Lock } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { DataTable } from '@/components/common/DataTable';
import { STUDENT_STATUS_LABELS, type StudentStatus } from '@/types';
import { maskIdCard, formatDateTime, getRelativeTime } from '@/utils/formatters';

export function ArchivePage() {
  const { students, users, loadStudents, loadUsers, notifications, getArchiveByStudentId, getLogsByStudentId, updateStudent, updateArchive } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [editingArchive, setEditingArchive] = useState<string | null>(null);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  const archiveList = students
    .map((student) => {
      const archive = getArchiveByStudentId(student.id);
      return {
        ...student,
        archive,
        unreadNotifications: notifications.filter(
          (n) => n.studentId === student.id && !n.isRead
        ).length,
      };
    })
    .filter((item) => {
      if (filter === 'pending') return item.archive?.archiveStatus === 'PENDING';
      if (filter === 'complete') return item.archive?.archiveStatus === 'COMPLETE' || item.archive?.archiveStatus === 'LOCKED';
      return true;
    });

  const selectedStudentData = students.find((s) => s.id === selectedStudent);
  const selectedArchive = selectedStudentData ? getArchiveByStudentId(selectedStudentData.id) : null;
  const studentLogs = selectedStudent ? getLogsByStudentId(selectedStudent) : [];

  const handleEditArchive = (studentId: string) => {
    const archive = getArchiveByStudentId(studentId);
    if (archive && archive.archiveStatus !== 'LOCKED') {
      setEditingArchive(studentId);
      setMissingDocs([...archive.missingDocuments]);
    }
  };

  const handleSaveArchive = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const archive = getArchiveByStudentId(studentId);
    if (!archive) return;

    const newArchiveStatus = missingDocs.length === 0 ? 'COMPLETE' : 'PENDING';
    const newDocumentStatus = missingDocs.length === 0 ? 'COMPLETE' : archive.documentStatus;

    updateArchive(studentId, {
      archiveStatus: newArchiveStatus,
      documentStatus: newDocumentStatus,
      missingDocuments: missingDocs,
    }, `档案${newArchiveStatus === 'COMPLETE' ? '完善完成' : '更新缺件清单'}`);

    if (newArchiveStatus === 'COMPLETE' && student.status === 'PENDING_REVIEW') {
      updateStudent(studentId, {
        status: 'REVIEW_PASSED',
      }, '档案完善完成，审核通过');
    }

    setEditingArchive(null);
    setSelectedStudent(null);
  };

  const handleAddMissingDoc = () => {
    const docName = prompt('请输入缺失文档名称：');
    if (docName && !missingDocs.includes(docName)) {
      setMissingDocs([...missingDocs, docName]);
    }
  };

  const handleRemoveMissingDoc = (doc: string) => {
    setMissingDocs(missingDocs.filter((d) => d !== doc));
  };

  const columns = [
    {
      key: 'studentNo',
      title: '学员编号',
      width: '120px',
      render: (item: any) => (
        <span className="font-mono text-sm">{item.studentNo}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      render: (item: any) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{maskIdCard(item.idCard)}</div>
        </div>
      ),
    },
    {
      key: 'archiveStatus',
      title: '档案状态',
      width: '120px',
      render: (item: any) => {
        const status = item.archive?.archiveStatus;
        const statusConfig = {
          PENDING: { label: '待完善', color: 'bg-amber-100 text-amber-700', icon: Clock },
          COMPLETE: { label: '已完善', color: 'bg-success-100 text-success-700', icon: CheckCircle },
          LOCKED: { label: '已锁定', color: 'bg-gray-100 text-gray-600', icon: Lock },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
          <span className={`status-badge ${config.color}`}>
            <Icon size={12} className="mr-1" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'missingDocuments',
      title: '缺件清单',
      render: (item: any) => {
        const missing = item.archive?.missingDocuments || [];
        if (missing.length === 0) {
          return <span className="text-sm text-gray-400">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {missing.map((doc: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                {doc}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'lastUpdate',
      title: '最后更新',
      width: '150px',
      render: (item: any) => {
        const updater = users.find((u) => u.id === item.archive?.lastUpdateBy);
        return (
          <div>
            <div className="text-sm">{updater?.name || '-'}</div>
            <div className="text-xs text-gray-500">
              {item.archive?.lastUpdateAt ? getRelativeTime(item.archive.lastUpdateAt) : '-'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'studentStatus',
      title: '报名状态',
      width: '100px',
      render: (item: any) => (
        <span className={`status-badge ${item.status === 'PENDING_REVIEW' ? 'bg-primary-100 text-primary-700' : item.status === 'ARCHIVED' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
          {STUDENT_STATUS_LABELS[item.status as StudentStatus]}
        </span>
      ),
    },
    {
      key: 'notifications',
      title: '变更通知',
      width: '80px',
      render: (item: any) => {
        if (item.unreadNotifications === 0) {
          return <span className="text-sm text-gray-400">-</span>;
        }
        return (
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            {item.unreadNotifications} 条
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (item: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedStudent(item.id)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            查看详情
          </button>
          {item.archive?.archiveStatus !== 'LOCKED' && (
            <button
              onClick={() => handleEditArchive(item.id)}
              className="text-sm text-accent-600 hover:text-accent-700"
            >
              编辑档案
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">资料建档</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          待完善
        </button>
        <button
          onClick={() => setFilter('complete')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'complete'
              ? 'bg-success-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          已完善
        </button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {archiveList.length}
            </div>
            <div className="text-sm text-gray-500">总档案数</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {archiveList.filter((a) => a.archive?.archiveStatus === 'PENDING').length}
            </div>
            <div className="text-sm text-amber-600">待完善</div>
          </div>
          <div className="p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600">
              {archiveList.filter((a) => a.archive?.archiveStatus === 'COMPLETE').length}
            </div>
            <div className="text-sm text-success-600">已完善</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {archiveList.filter((a) => a.archive?.archiveStatus === 'LOCKED').length}
            </div>
            <div className="text-sm text-gray-500">已锁定</div>
          </div>
        </div>

        <DataTable columns={columns} data={archiveList} />
      </div>

      {selectedStudentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">学员档案详情</h2>
                <p className="text-sm text-gray-500">{selectedStudentData.studentNo}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">姓名</div>
                  <div className="text-lg font-medium">{selectedStudentData.name}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">身份证号</div>
                  <div className="text-lg font-medium">{maskIdCard(selectedStudentData.idCard)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="text-lg font-medium">{selectedStudentData.phone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">车型</div>
                  <div className="text-lg font-medium">{selectedStudentData.carType}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">报名日期</div>
                  <div className="text-lg font-medium">{selectedStudentData.enrollmentDate}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">报名状态</div>
                  <div className={`text-lg font-medium ${selectedStudentData.status === 'PENDING_REVIEW' ? 'text-primary-600' : selectedStudentData.status === 'ARCHIVED' ? 'text-success-600' : 'text-gray-600'}`}>
                    {STUDENT_STATUS_LABELS[selectedStudentData.status]}
                  </div>
                </div>
              </div>

              {selectedArchive && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">档案信息</h3>
                  
                  {editingArchive === selectedStudentData.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          缺失文档清单
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {missingDocs.map((doc, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm flex items-center gap-1"
                            >
                              {doc}
                              <button
                                onClick={() => handleRemoveMissingDoc(doc)}
                                className="hover:text-amber-900"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={handleAddMissingDoc}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          添加缺件
                        </button>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingArchive(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSaveArchive(selectedStudentData.id)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-1"
                        >
                          <Save size={14} />
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">档案状态</span>
                        <span className={`px-3 py-1 rounded-lg text-sm ${
                          selectedArchive.archiveStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          selectedArchive.archiveStatus === 'COMPLETE' ? 'bg-success-100 text-success-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedArchive.archiveStatus === 'PENDING' ? '待完善' : 
                           selectedArchive.archiveStatus === 'COMPLETE' ? '已完善' : '已锁定'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">资料状态</span>
                        <span className={`px-3 py-1 rounded-lg text-sm ${
                          selectedArchive.documentStatus === 'PENDING' ? 'bg-gray-100 text-gray-600' :
                          'bg-success-100 text-success-700'
                        }`}>
                          {selectedArchive.documentStatus === 'PENDING' ? '待提交' : '已提交'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">缺件清单</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedArchive.missingDocuments.length === 0 ? (
                            <span className="text-gray-400">无</span>
                          ) : (
                            selectedArchive.missingDocuments.map((doc, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                              >
                                {doc}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">最后更新人</span>
                        <span className="font-medium">
                          {users.find((u) => u.id === selectedArchive.lastUpdateBy)?.name || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">最后更新时间</span>
                        <span>{formatDateTime(selectedArchive.lastUpdateAt)}</span>
                      </div>
                      {selectedArchive.archiveStatus !== 'LOCKED' && (
                        <button
                          onClick={() => handleEditArchive(selectedStudentData.id)}
                          className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center justify-center gap-1"
                        >
                          <Edit2 size={14} />
                          编辑档案
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {studentLogs.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">操作历史</h3>
                  <div className="space-y-3">
                    {studentLogs.map((log) => {
                      const operator = users.find((u) => u.id === log.operatorId);
                      return (
                        <div
                          key={log.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{operator?.name || '-'}</span>
                            <span className="text-xs text-gray-500">{formatDateTime(log.operatedAt)}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {log.changeReason || '操作记录'}
                          </div>
                          {log.beforeValue && log.afterValue && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="text-gray-400">变更前:</span> {JSON.stringify(log.beforeValue)}
                              <span className="mx-2">→</span>
                              <span className="text-gray-400">变更后:</span> {JSON.stringify(log.afterValue)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}