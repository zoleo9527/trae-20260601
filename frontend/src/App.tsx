import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RoleSelector } from './components/RoleSelector';
import { TodoList } from './components/TodoList';
import { CreateRecordModal } from './components/CreateRecordModal';
import { ExamTrackRecord, UserRole } from './types';
import { api, setApiConfig } from './api';
import { Plus, RefreshCw } from 'lucide-react';
import { getRoleLabel } from './utils';

const roleUsers: Record<UserRole, { id: string; name: string }> = {
  [UserRole.ADMIN]: { id: 'admin-1', name: '王教务' },
  [UserRole.TEACHER]: { id: 'teacher-1', name: '李老师' },
  [UserRole.CONSULTANT]: { id: 'consultant-1', name: '张顾问' },
};

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.TEACHER);
  const [records, setRecords] = useState<ExamTrackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const user = roleUsers[currentRole];
    setApiConfig({
      role: currentRole,
      userId: user.id,
      userName: user.name,
    });
    fetchRecords();
  }, [currentRole]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await api.examTracks.list();
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
  };

  const handleCreateRecord = async (recordData: any) => {
    try {
      await api.examTracks.create(recordData);
      setShowCreateModal(false);
      fetchRecords();
    } catch (error) {
      console.error('Failed to create record:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentRole={currentRole} userName={roleUsers[currentRole].name} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RoleSelector currentRole={currentRole} onRoleChange={handleRoleChange} />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">我的待办</h2>
            <p className="text-sm text-gray-500">
              {getRoleLabel(currentRole)} - 当前显示您的待办任务
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            
            {currentRole === UserRole.TEACHER && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                新建记录
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : (
          <TodoList records={records} currentRole={currentRole} onRefresh={fetchRecords} />
        )}
      </main>

      {showCreateModal && (
        <CreateRecordModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRecord}
        />
      )}
    </div>
  );
}

export default App;
