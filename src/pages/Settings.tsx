import { useState } from 'react';
import { Users, Bell, Shield, Database, UserPlus, Edit2, Trash2, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { mockUsers, roleNames } from '../data/mockData';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');

  return (
    <Layout title="系统设置" subtitle="管理系统配置和用户权限">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  用户管理
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Database className="w-4 h-4 inline mr-2" />
                  系统配置
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-slate-800">用户列表</h4>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <UserPlus className="w-4 h-4" />
                      添加用户
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mockUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === 'project_manager' ? 'bg-green-100 text-green-600' :
                            user.role === 'review_secretary' ? 'bg-blue-100 text-blue-600' :
                            user.role === 'finance' ? 'bg-amber-100 text-amber-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {roleNames[user.role]}
                          </span>
                          <div className="flex items-center gap-1">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      通知设置
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">中标通知审核提醒</p>
                          <p className="text-sm text-slate-500">当有新的中标通知需要审核时发送提醒</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">退款申请审核提醒</p>
                          <p className="text-sm text-slate-500">当有新的退款申请需要审核时发送提醒</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">驳回通知提醒</p>
                          <p className="text-sm text-slate-500">当申请被驳回时发送通知提醒</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      权限设置
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg">
                        <p className="text-sm text-slate-500">项目专员</p>
                        <p className="text-lg font-bold text-slate-800">3</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <p className="text-sm text-slate-500">评审秘书</p>
                        <p className="text-lg font-bold text-slate-800">2</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <p className="text-sm text-slate-500">财务</p>
                        <p className="text-lg font-bold text-slate-800">2</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4">系统信息</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">系统版本</span>
                <span className="font-medium text-slate-800">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">最后更新</span>
                <span className="font-medium text-slate-800">2024-03-16</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">数据存储</span>
                <span className="font-medium text-slate-800">本地模拟数据</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4">演示账号</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">项目专员</p>
                <p className="text-xs text-blue-600">zhangwei@example.com</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm font-medium text-amber-800">评审秘书</p>
                <p className="text-xs text-amber-600">liling@example.com</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">财务</p>
                <p className="text-xs text-green-600">wangqiang@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
