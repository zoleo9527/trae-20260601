import { ArrowLeft, Clock, FileText, Mail, Phone, Plus, Send, User, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addCommunicationHistory, fetchCommunicationDetail } from '../api/client';
import { ActionDrawer } from '../components/ActionDrawer';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useCommunicationStore } from '../store';
import type { Communication, CommunicationHistory } from '../types';

const typeOptions = [
  { value: 'call', label: '电话沟通' },
  { value: 'message', label: '消息沟通' },
  { value: 'meeting', label: '面谈' },
];

export function CommunicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateCommunication, drawerOpen, setDrawerOpen } = useCommunicationStore();
  const [loading, setLoading] = useState(true);
  const [communication, setCommunication] = useState<Communication | null>(null);
  const [history, setHistory] = useState<CommunicationHistory[]>([]);
  const [newType, setNewType] = useState<CommunicationHistory['type']>('call');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      const { communication: data, history: historyData } = await fetchCommunicationDetail(id);
      setCommunication(data);
      setHistory(historyData);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleAddHistory = async () => {
    if (!id || !newContent.trim()) return;
    const result = await addCommunicationHistory(id, newType, newContent);
    setCommunication(result.communication);
    setHistory(result.history);
    updateCommunication(result.communication);
    setDrawerOpen(false);
    setNewContent('');
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      teaching: '任课老师',
      consultant: '家长顾问',
      admin: '教务老师',
      system: '系统',
    };
    return roles[role] || role;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="p-6">
        <p className="text-gray-500">沟通记录不存在</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/communications')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">沟通详情</h1>
          <p className="text-gray-500 mt-1">{communication.studentName} - {communication.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">学员信息</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <img
                  src={communication.studentAvatar}
                  alt={communication.studentName}
                  className="w-20 h-20 rounded-full bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{communication.studentName}</h3>
                  <p className="text-gray-500 mt-1">{communication.subject}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>负责人: {communication.responsibleName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={communication.status} type="communication" />
                  <PriorityBadge priority={communication.priority} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">沟通历史</h2>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加记录
              </button>
            </div>
            <div className="p-6 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无沟通记录</p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div key={item.id} className={`flex gap-4 ${index % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index % 2 === 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className={`max-w-[70%] ${index % 2 === 0 ? '' : 'text-right'}`}>
                      <div className={`inline-block px-4 py-2 rounded-2xl ${
                        index % 2 === 0 ? 'bg-primary-50 text-gray-800 rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{item.content}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-2 ${index % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                        <span className="text-xs text-gray-400">{item.operator}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                          {getRoleLabel(item.operatorRole)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">快捷操作</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full py-3 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                拨打电话
              </button>
              <button className="w-full py-3 bg-blue-100 text-blue-700 font-medium rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                发送消息
              </button>
              <button className="w-full py-3 bg-purple-100 text-purple-700 font-medium rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2">
                <Video className="w-4 h-4" />
                预约面谈
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">任务信息</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm text-gray-800">{communication.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">更新时间</span>
                <span className="text-sm text-gray-800">{communication.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">最后联系</span>
                <span className="text-sm text-gray-800">{communication.lastContactAt || '暂无'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="添加沟通记录"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">沟通方式</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as CommunicationHistory['type'])}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">沟通内容</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="请输入沟通内容..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddHistory}
              disabled={!newContent.trim()}
              className="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              保存记录
            </button>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
}
