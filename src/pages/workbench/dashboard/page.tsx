import { useWorkOrderStore } from '../../../store/workOrderStore';
import { useDispatchStore } from '../../../store/dispatchStore';
import { useTechnicianStore } from '../../../store/technicianStore';
import { useExceptionStore } from '../../../store/exceptionStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const orders = useWorkOrderStore((state) => state.orders);
  const dispatches = useDispatchStore((state) => state.dispatches);
  const technicians = useTechnicianStore((state) => state.technicians);
  const exceptions = useExceptionStore((state) => state.exceptions);

  const allExceptions = [
    ...exceptions,
    ...orders.flatMap(order =>
      order.exceptions.filter(
        exc => !exceptions.find(e => e.id === exc.id)
      )
    ),
  ];

  const orderStatusData = [
    { name: '待处理', value: orders.filter((o) => o.status === 'pending').length, color: '#f39c12' },
    { name: '进行中', value: orders.filter((o) => o.status === 'in_progress').length, color: '#3498db' },
    { name: '已完成', value: orders.filter((o) => o.status === 'completed').length, color: '#27ae60' },
    { name: '已暂停', value: orders.filter((o) => o.status === 'suspended').length, color: '#e94560' },
  ];

  const technicianWorkloadData = technicians.map((tech) => ({
    name: tech.name,
    orders: tech.stats.todayOrders,
    avgTime: tech.stats.avgCompletionTime,
  }));

  const exceptionTypeData = [
    { name: '型号错误', value: allExceptions.filter((e) => e.type === 'wrong_model').length, color: '#e94560' },
    { name: '补胎争议', value: allExceptions.filter((e) => e.type === 'warranty_dispute').length, color: '#f39c12' },
    { name: '库存问题', value: allExceptions.filter((e) => e.type === 'inventory_issue').length, color: '#3498db' },
    { name: '其他', value: allExceptions.filter((e) => e.type === 'other').length, color: '#a0a0a0' },
  ];

  const totalExceptions = allExceptions.length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#eaeaea]">数据看板</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <p className="text-sm text-[#a0a0a0] mb-2">工单总数</p>
          <p className="text-3xl font-bold text-[#eaeaea]">{orders.length}</p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <p className="text-sm text-[#a0a0a0] mb-2">派工总数</p>
          <p className="text-3xl font-bold text-[#eaeaea]">{dispatches.length}</p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <p className="text-sm text-[#a0a0a0] mb-2">异常总数</p>
          <p className="text-3xl font-bold text-[#e94560]">{totalExceptions}</p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <p className="text-sm text-[#a0a0a0] mb-2">技师总数</p>
          <p className="text-3xl font-bold text-[#eaeaea]">{technicians.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#16213e] rounded-lg p-6 border border-[#1a1a2e]">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">工单状态分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #16213e',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#16213e] rounded-lg p-6 border border-[#1a1a2e]">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">技师工作量统计</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={technicianWorkloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16213e" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #16213e',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="orders" fill="#0f3460" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#16213e] rounded-lg p-6 border border-[#1a1a2e]">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">异常类型分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={exceptionTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {exceptionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #16213e',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#16213e] rounded-lg p-6 border border-[#1a1a2e]">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">技师平均完成时间</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={technicianWorkloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16213e" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" unit="分钟" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #16213e',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => `${value}分钟`}
              />
              <Bar dataKey="avgTime" fill="#e94560" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
