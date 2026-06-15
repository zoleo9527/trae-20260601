import DashboardShell from '../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/enums';

export default async function InventoryPage() {
  const user = await requireRole([Role.PARTS_ADMIN]);

  const parts = await prisma.part.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  const categories = [...new Set(parts.map((p) => p.category))];
  const totalValue = parts.reduce((sum, p) => sum + p.stock * p.price, 0);

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">配件品类数</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{parts.length}</div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <div className="text-sm text-green-700">库存总价值</div>
            <div className="text-3xl font-bold text-green-900 mt-2">¥{totalValue.toFixed(0)}</div>
          </div>
          <div className="card bg-yellow-50 border-yellow-100">
            <div className="text-sm text-yellow-700">低库存</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">
              {parts.filter((p) => p.stock > 0 && p.stock <= 10).length}
            </div>
          </div>
          <div className="card bg-red-50 border-red-100">
            <div className="text-sm text-red-700">缺货</div>
            <div className="text-3xl font-bold text-red-900 mt-2">{parts.filter((p) => p.stock === 0).length}</div>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{cat}</h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">编号</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">名称</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">库存</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">单价</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">库存价值</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {parts
                    .filter((p) => p.category === cat)
                    .map((part) => (
                      <tr key={part.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">{part.partNo}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{part.name}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-bold ${
                              part.stock === 0
                                ? 'text-red-600'
                                : part.stock <= 10
                                ? 'text-orange-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {part.stock} {part.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">¥{part.price}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ¥{(part.stock * part.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {part.stock === 0 ? (
                            <span className="badge bg-red-100 text-red-700">缺货</span>
                          ) : part.stock <= 10 ? (
                            <span className="badge bg-orange-100 text-orange-700">库存不足</span>
                          ) : (
                            <span className="badge bg-green-100 text-green-700">充足</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
