import { ArrowLeft, ClipboardCheck, Factory, Package, Search, ThermometerSnowflake, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export function BatchTrace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, traces } = useAppStore();
  const [searchBatch, setSearchBatch] = useState('');

  const currentCase = cases.find((c) => c.id === id);
  const batchNo = currentCase?.batchNo || searchBatch;
  const trace = batchNo ? traces[batchNo] : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">批次反查溯源</h2>
          <p className="text-slate-500 mt-1">根据产品批号追溯全链路信息</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              产品批号
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchBatch || batchNo || ''}
                onChange={(e) => setSearchBatch(e.target.value)}
                placeholder="输入产品批号进行查询..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            查询
          </button>
        </form>

        {currentCase && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="text-sm text-slate-500 mb-2">当前关联案件</div>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <span className="font-mono text-sm font-medium text-[#1E3A5F]">
                {currentCase.caseNo}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-700">{currentCase.customerName}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-700">{currentCase.productName}</span>
              <Link
                to={`/return/${currentCase.id}`}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看案件详情 →
              </Link>
            </div>
          </div>
        )}
      </div>

      {trace ? (
        <div className="grid grid-cols-3 gap-6">
          <TraceCard
            icon={Package}
            title="原料批次信息"
            color="blue"
            borderColor="border-blue-200"
            bgColor="bg-blue-50/50"
          >
            <InfoRow label="原料批号" value={trace.rawMaterial.rawBatchNo} mono />
            <InfoRow label="供应商" value={trace.rawMaterial.supplier} />
            <InfoRow label="供货日期" value={trace.rawMaterial.supplyDate} />
            <InfoRow label="进厂检验" value={trace.rawMaterial.inspectionReport} mono />
            <InfoRow label="检疫证明" value={trace.rawMaterial.quarantineNo} mono />
            <InfoRow label="总重量" value={`${trace.rawMaterial.weight} kg`} />
          </TraceCard>

          <TraceCard
            icon={Factory}
            title="生产加工信息"
            color="green"
            borderColor="border-green-200"
            bgColor="bg-green-50/50"
          >
            <InfoRow label="生产车间" value={trace.production.workshop} />
            <InfoRow label="班组" value={`${trace.production.teamNo} (${trace.production.shift})`} />
            <InfoRow label="班长" value={trace.production.teamLeader} />
            <InfoRow label="生产日期" value={trace.production.productionDate} />
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2">加工流程记录</div>
              <ul className="space-y-1.5">
                {trace.production.processRecords.map((record, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {record}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2">使用设备</div>
              <div className="flex flex-wrap gap-2">
                {trace.production.equipment.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </TraceCard>

          <TraceCard
            icon={ThermometerSnowflake}
            title="冷库存储记录"
            color="cyan"
            borderColor="border-cyan-200"
            bgColor="bg-cyan-50/50"
          >
            <InfoRow label="冷库编号" value={trace.coldStorage.warehouseNo} />
            <InfoRow label="库位编码" value={trace.coldStorage.locationCode} mono />
            <InfoRow label="入库时间" value={trace.coldStorage.inTime} />
            <InfoRow label="存储温度" value={`${trace.coldStorage.temperature}℃`} />
            <InfoRow
              label="当前库存"
              value={`${trace.coldStorage.remainingStock} ${trace.coldStorage.unit}`}
              highlight
            />
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                出库记录
              </div>
              <div className="space-y-2">
                {trace.coldStorage.outRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-white border border-slate-100 rounded-md text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-700">{record.customerName}</span>
                      <span className="text-cyan-700 font-medium">{record.quantity} kg</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{record.outTime}</div>
                    <div className="text-xs text-slate-400 mt-0.5">订单: {record.orderNo}</div>
                  </div>
                ))}
              </div>
            </div>
          </TraceCard>
        </div>
      ) : batchNo ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <div className="text-lg font-medium text-slate-600">未找到该批号的溯源信息</div>
          <div className="text-sm text-slate-400 mt-2">请检查批号是否正确</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <div className="text-lg font-medium text-slate-600">请输入产品批号进行查询</div>
          <div className="text-sm text-slate-400 mt-2">支持追溯原料、生产、冷库全链路信息</div>
        </div>
      )}

      {trace && (
        <div className="flex justify-end gap-4">
          <Link
            to={`/return/${id}/reinspect`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors shadow-sm font-medium"
          >
            前往复检处理
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      )}
    </div>
  );
}

interface TraceCardProps {
  icon: React.ElementType;
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
}

function TraceCard({ icon: Icon, title, color, borderColor, bgColor, children }: TraceCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    cyan: 'text-cyan-600 bg-cyan-100',
  };

  return (
    <div className={`bg-white rounded-lg border ${borderColor} shadow-sm overflow-hidden`}>
      <div className={`px-5 py-4 ${bgColor} border-b ${borderColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

function InfoRow({ label, value, mono, highlight }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${mono ? 'font-mono' : ''} ${
          highlight ? 'font-semibold text-[#1E3A5F]' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
