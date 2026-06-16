import React, { useState, useEffect } from 'react';
import { ClipboardList, Users, Clock, Utensils, Search } from 'lucide-react';
import { Assignment, Queue, Table } from '../types';
import { assignmentApi, queueApi, tableApi } from '../api';

export const AssignmentHistory: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, queuesData, tablesData] = await Promise.all([
        assignmentApi.getAssignments(),
        queueApi.getQueues(),
        tableApi.getTables(),
      ]);
      setAssignments(assignmentsData);
      setQueues(queuesData);
      setTables(tablesData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQueueByQueueId = (queueId: string) => {
    return queues.find(q => q.id === queueId);
  };

  const getTableByTableId = (tableId: string) => {
    return tables.find(t => t.id === tableId);
  };

  const filteredAssignments = assignments.filter(
    (a) =>
      a.assignedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getQueueByQueueId(a.queueId)?.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTableByTableId(a.tableId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">桌台分配回看</h2>
          <p className="text-sm text-gray-500">查看所有桌台分配记录，便于责任追溯</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm w-64"
            placeholder="搜索分配记录..."
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分配时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排号信息</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">桌台信息</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">确认人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">加载中...</p>
                </td>
              </tr>
            ) : filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => {
                const queue = getQueueByQueueId(assignment.queueId);
                const table = getTableByTableId(assignment.tableId);
                const isCompleted = queue?.status === 'completed';
                
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDateTime(assignment.assignedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{queue?.customerName || '未知顾客'}</p>
                          <p className="text-xs text-gray-500">{queue?.partySize || 0}人</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{table?.name || '未知桌台'}</p>
                          <p className="text-xs text-gray-500">{table?.position || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {assignment.assignedByName}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-600' 
                          : queue?.status === 'seated' 
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {isCompleted ? '已完成' : queue?.status === 'seated' ? '在用中' : '等待中'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无分配记录</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
