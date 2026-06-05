import { useEffect } from 'react';
import { useStore, Complaint, InventoryItem } from '@/store';

const complaintStatusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'badge-draft' },
  processing: { label: '处理中', cls: 'badge-active' },
  resolved: { label: '已解决', cls: 'badge-deprecated' },
};

export default function ComplaintsInventory() {
  const {
    complaints, inventory, loading,
    complaintsTab, setComplaintsTab,
    fetchComplaints, fetchInventory,
  } = useStore();

  useEffect(() => {
    fetchComplaints();
    fetchInventory();
  }, [fetchComplaints, fetchInventory]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-bold text-roast-text mb-6">客诉与库存</h1>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${complaintsTab === 'complaints' ? 'bg-white text-roast-brown shadow-sm' : 'text-gray-500 hover:text-roast-text'}`}
          onClick={() => setComplaintsTab('complaints')}
        >
          客诉列表
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${complaintsTab === 'inventory' ? 'bg-white text-roast-brown shadow-sm' : 'text-gray-500 hover:text-roast-text'}`}
          onClick={() => setComplaintsTab('inventory')}
        >
          库存状态
        </button>
      </div>

      {complaintsTab === 'complaints' ? (
        <ComplaintsTab complaints={complaints} loading={loading.complaints} />
      ) : (
        <InventoryTab inventory={inventory} loading={loading.inventory} />
      )}
    </div>
  );
}

function ComplaintsTab({ complaints, loading }: { complaints: Complaint[]; loading: boolean }) {
  if (loading) {
    return <div className="table-container animate-pulse"><table><thead><tr>{[1,2,3,4,5,6].map(i=><th key={i}><div className="h-4 bg-gray-200 rounded" /></th>)}</tr></thead></table></div>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>客户</th>
            <th>渠道</th>
            <th>内容</th>
            <th>状态</th>
            <th>关联曲线/杯测</th>
            <th>处理人</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr><td colSpan={6} className="text-center text-gray-400 py-8">暂无数据</td></tr>
          ) : (
            complaints.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.customer}</td>
                <td>{c.channel}</td>
                <td className="max-w-[240px] truncate">{c.content}</td>
                <td><span className={complaintStatusMap[c.status]?.cls}>{complaintStatusMap[c.status]?.label}</span></td>
                <td className="text-xs">
                  {c.linkedCurveId && <span className="text-roast-orange">曲线</span>}
                  {c.linkedCurveId && c.linkedScoreId && <span className="text-gray-300 mx-1">/</span>}
                  {c.linkedScoreId && <span className="text-roast-brown">杯测</span>}
                  {!c.linkedCurveId && !c.linkedScoreId && <span className="text-gray-300">-</span>}
                </td>
                <td>{c.handler}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTab({ inventory, loading }: { inventory: InventoryItem[]; loading: boolean }) {
  if (loading) {
    return <div className="table-container animate-pulse"><table><thead><tr>{[1,2,3,4,5,6,7].map(i=><th key={i}><div className="h-4 bg-gray-200 rounded" /></th>)}</tr></thead></table></div>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>批次号</th>
            <th>豆种</th>
            <th>数量/剩余</th>
            <th>烘焙日期</th>
            <th>到期日</th>
            <th>FIFO状态</th>
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr><td colSpan={6} className="text-center text-gray-400 py-8">暂无数据</td></tr>
          ) : (
            inventory.map((item) => (
              <tr
                key={item.id}
                className={item.fifoStatus === 'expired' ? 'bg-red-50' : item.fifoStatus === 'warning' ? 'bg-amber-50' : ''}
              >
                <td className="font-medium">{item.batchCode}</td>
                <td>{item.beanType}</td>
                <td>
                  <span className={item.remaining < item.quantity * 0.2 ? 'text-risk-red font-medium' : ''}>
                    {item.remaining}
                  </span>
                  <span className="text-gray-400">/{item.quantity}</span>
                </td>
                <td className="text-xs text-gray-500">{new Date(item.roastDate).toLocaleDateString('zh-CN')}</td>
                <td className="text-xs text-gray-500">{new Date(item.expiryDate).toLocaleDateString('zh-CN')}</td>
                <td>
                  {item.fifoStatus === 'expired' ? <span className="badge-risk">已过期</span> :
                   item.fifoStatus === 'warning' ? <span className="badge-draft">临近过期</span> :
                   <span className="badge-active">正常</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
