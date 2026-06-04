import { motion } from 'framer-motion';
import { Beer, Clock, CheckCircle2, AlertTriangle, Thermometer, Droplets, Gauge, Eye, MessageSquare } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { BatchDetailDrawer } from '@/components/features/BatchDetailDrawer';
import { useBatchStore } from '@/store/useBatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DOT_COLORS } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function BrewerDashboard() {
  const { currentUser } = useAuthStore();
  const { batches, setSelectedBatchId, setIsDrawerOpen, getNotesByBatchId } = useBatchStore();

  const stats = {
    pending: batches.filter((b) => b.currentStatus === 'PENDING_TEST').length,
    testing: batches.filter((b) => b.currentStatus === 'TESTING').length,
    abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
    passed: batches.filter((b) => b.currentStatus === 'TEST_PASSED').length,
    released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
    rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
  };

  const myBatches = batches.filter((b) => b.createdBy === currentUser?.name || true);

  const handleViewDetail = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDrawerOpen(true);
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar role="brewer" />

      <div className="flex-1">
        <Header title="酿酒师工作台" />

        <main className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="发酵中批次"
              value={stats.pending + stats.testing}
              icon={<Beer className="w-6 h-6" />}
              color="amber"
              delay={0}
            />
            <StatCard
              title="待检测"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              color="blue"
              delay={0.1}
            />
            <StatCard
              title="已放行"
              value={stats.released}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="green"
              delay={0.2}
            />
            <StatCard
              title="需关注"
              value={stats.abnormal + stats.rejected}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="orange"
              delay={0.3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <FementationTankCard
              tankNo="F-01"
              product="德式小麦"
              temp="19°C"
              gravity="1.012"
              pressure="0.8 bar"
              status="normal"
            />
            <FementationTankCard
              tankNo="F-03"
              product="经典美式IPA"
              temp="20°C"
              gravity="1.015"
              pressure="1.0 bar"
              status="normal"
            />
            <FementationTankCard
              tankNo="F-05"
              product="燕麦世涛"
              temp="21°C"
              gravity="1.020"
              pressure="1.2 bar"
              status="warning"
            />
          </div>

          {stats.abnormal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-warning-50 border border-warning-orange/30 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-warning-orange flex-shrink-0" />
              <div>
                <p className="font-medium text-warning-orange">异常批次提醒</p>
                <p className="text-sm text-neutral-600">当前有 {stats.abnormal} 个批次检测异常，请关注品控反馈</p>
              </div>
            </motion.div>
          )}

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-800">我的批次</h2>
                <Button variant="primary" size="sm">
                  发起检测申请
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">批次号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">产品名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">发酵罐</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">发酵日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">数量</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">备注</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {myBatches.map((batch, index) => {
                      const notes = getNotesByBatchId(batch.id);
                      const hasPackagingNote = notes.some((n) => n.role === 'packaging');

                      return (
                        <motion.tr
                          key={batch.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`hover:bg-neutral-50 transition-colors ${batch.currentStatus === 'TEST_ABNORMAL' ? 'bg-warning-50/30' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-neutral-800">{batch.batchNo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-neutral-800">{batch.productName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-neutral-600">{batch.tankNo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-neutral-600">{batch.fermentationDate}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-neutral-600">{batch.quantity} L</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={batch.currentStatus} showPulse />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-neutral-400" />
                              <span className="text-sm text-neutral-600">{notes.length}</span>
                              {hasPackagingNote && (
                                <span className="text-xs text-blue-600">有品控反馈</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(batch.id)}>
                              <Eye className="w-4 h-4 mr-1" />
                              查看
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </main>
      </div>

      <BatchDetailDrawer />
    </div>
  );
}

interface TankCardProps {
  tankNo: string;
  product: string;
  temp: string;
  gravity: string;
  pressure: string;
  status: 'normal' | 'warning';
}

function FementationTankCard({ tankNo, product, temp, gravity, pressure, status }: TankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-5 rounded-xl ${
        status === 'warning'
          ? 'bg-warning-50 border-2 border-warning-orange/30'
          : 'bg-white border border-neutral-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-neutral-800">{tankNo}</h3>
          <p className="text-sm text-neutral-600">{product}</p>
        </div>
        {status === 'warning' && (
          <span className="flex items-center gap-1 text-xs text-warning-orange bg-warning-orange/10 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            注意
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-white rounded-lg">
          <Thermometer className={`w-5 h-5 mx-auto mb-1 ${status === 'warning' ? 'text-warning-orange' : 'text-neutral-500'}`} />
          <p className="text-lg font-semibold text-neutral-800">{temp}</p>
          <p className="text-xs text-neutral-500">温度</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <Droplets className="w-5 h-5 mx-auto mb-1 text-neutral-500" />
          <p className="text-lg font-semibold text-neutral-800">{gravity}</p>
          <p className="text-xs text-neutral-500">比重</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <Gauge className="w-5 h-5 mx-auto mb-1 text-neutral-500" />
          <p className="text-lg font-semibold text-neutral-800">{pressure}</p>
          <p className="text-xs text-neutral-500">压力</p>
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-3 text-right">
        最后更新: {format(new Date(), 'HH:mm', { locale: zhCN })}
        <span className="text-neutral-300 ml-1">(模拟数据)</span>
      </p>
    </motion.div>
  );
}
