import React, { useState } from 'react';
import { WindowStaffPage } from './pages/WindowStaff';
import { NotaryPage } from './pages/Notary';
import { ArchiveKeeperPage } from './pages/ArchiveKeeper';
import { OperatorRole } from './types';
import { setCurrentUser } from './services/api';

const demoUsers = [
  { id: 'USER-W001', name: '陈窗口', role: OperatorRole.WINDOW_STAFF },
  { id: 'USER-N001', name: '刘公证员', role: OperatorRole.NOTARY },
  { id: 'USER-A001', name: '李档案', role: OperatorRole.ARCHIVE_KEEPER },
];

function App() {
  const [currentUser, setCurrentUserState] = useState<typeof demoUsers[0] | null>(null);

  const handleLogin = (user: typeof demoUsers[0]) => {
    setCurrentUserState(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser({
      id: '',
      name: '',
      role: OperatorRole.WINDOW_STAFF
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            公证处窗口系统
          </h1>
          <p className="text-center text-gray-600 mb-8">
            卷宗归档与领取确认工作台
          </p>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">选择角色登录</h2>

            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">
                      {user.role === OperatorRole.WINDOW_STAFF
                        ? '窗口人员'
                        : user.role === OperatorRole.NOTARY
                        ? '公证员'
                        : '档案员'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">系统特点</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>分开设计的三个角色入口</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>完整的责任链追踪</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>归档到领取的自然衔接</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>流程断裂场景提醒测试</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">公证处窗口系统</h1>
            <p className="text-sm text-gray-600">
              当前用户: {currentUser.name} (ID: {currentUser.id}) |{' '}
              {currentUser.role === OperatorRole.WINDOW_STAFF
                ? '窗口人员'
                : currentUser.role === OperatorRole.NOTARY
                ? '公证员'
                : '档案员'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {currentUser.role === OperatorRole.WINDOW_STAFF && (
        <WindowStaffPage user={currentUser} />
      )}
      {currentUser.role === OperatorRole.NOTARY && <NotaryPage user={currentUser} />}
      {currentUser.role === OperatorRole.ARCHIVE_KEEPER && (
        <ArchiveKeeperPage user={currentUser} />
      )}
    </div>
  );
}

export default App;
