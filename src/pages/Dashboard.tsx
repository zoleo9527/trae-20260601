
import { useState, useEffect } from 'react';
import { Card, Button, Spin, Tag } from 'antd';
import {
  ShoppingBag,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userApi, promotionApi, inspectionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { DashboardStats, PromotionDisplay, InspectionRectification } from '../../shared/types';
import dayjs from 'dayjs';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPromotions, setRecentPromotions] = useState<PromotionDisplay[]>([]);
  const [recentInspections, setRecentInspections] = useState<InspectionRectification[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, promotions, inspections] = await Promise.all([
        userApi.getDashboardStats(),
        promotionApi.getAll(),
        inspectionApi.getAll(),
      ]);
      setStats(statsData);
      setRecentPromotions(promotions.slice(0, 3));
      setRecentInspections(inspections.slice(0, 3));
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      processing: { color: 'blue', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      has_issue: { color: 'red', text: '有问题' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const getInspectionStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待整改' },
      processing: { color: 'blue', text: '整改中' },
      reviewing: { color: 'purple', text: '待审核' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已退回' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  const showPromotionCreate = user?.role === 'product_specialist';
  const showInspectionCreate = user?.role === 'supervisor';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">工作台</h1>
        <p className="text-gray-500">欢迎回来，{user?.name}！今天是 {dayjs().format('YYYY年MM月DD日')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">待处理促销陈列</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.pendingPromotions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">处理中促销陈列</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.processingPromotions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">待整改/退回</p>
              <p className="text-3xl font-bold text-red-600">
                {(stats?.pendingInspections || 0) + (stats?.rejectedInspections || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">已完成任务</p>
              <p className="text-3xl font-bold text-green-600">
                {(stats?.completedPromotions || 0) + (stats?.completedInspections || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="最新促销陈列"
          extra={
            <div className="flex gap-2">
              {showPromotionCreate && (
                <Button type="primary" size="small" onClick={() => navigate('/promotion/create')}>
                  新建促销
                </Button>
              )}
              <Button size="small" onClick={() => navigate('/promotion')}>
                查看全部 <ArrowRight size={14} className="inline ml-1" />
              </Button>
            </div>
          }
          className="border-0 shadow-sm"
        >
          {recentPromotions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无促销陈列任务</p>
          ) : (
            <div className="space-y-3">
              {recentPromotions.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(`/promotion/${p.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.storeName} · 截止 {dayjs(p.deadline).format('MM-DD')}</p>
                  </div>
                  <div className="ml-4">{getPromotionStatusTag(p.status)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="最新巡店整改"
          extra={
            <div className="flex gap-2">
              {showInspectionCreate && (
                <Button type="primary" size="small" onClick={() => navigate('/inspection/create')}>
                  发起整改
                </Button>
              )}
              <Button size="small" onClick={() => navigate('/inspection')}>
                查看全部 <ArrowRight size={14} className="inline ml-1" />
              </Button>
            </div>
          }
          className="border-0 shadow-sm"
        >
          {recentInspections.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无巡店整改任务</p>
          ) : (
            <div className="space-y-3">
              {recentInspections.map((i) => (
                <div
                  key={i.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    i.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => navigate(`/inspection/${i.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {i.status === 'rejected' && <span className="text-red-600 mr-2">⚠</span>}
                      {i.title}
                    </p>
                    <p className="text-sm text-gray-500">{i.storeName} · {dayjs(i.createdAt).format('MM-DD HH:mm')}</p>
                    {i.lastRejectReason && (
                      <p className="text-xs text-red-500 mt-1">退回原因：{i.lastRejectReason}</p>
                    )}
                  </div>
                  <div className="ml-4">{getInspectionStatusTag(i.status)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
