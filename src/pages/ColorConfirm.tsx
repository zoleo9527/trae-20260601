import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Palette, 
  CheckCircle2, 
  Clock,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SHADE_COLORS } from '@/types';

const shadeColorMap: Record<string, string> = {
  'A1': 'bg-amber-100 border-amber-300',
  'A2': 'bg-amber-200 border-amber-400',
  'A3': 'bg-amber-300 border-amber-500',
  'A3.5': 'bg-amber-400 border-amber-600',
  'A4': 'bg-amber-500 border-amber-700',
  'B1': 'bg-yellow-100 border-yellow-300',
  'B2': 'bg-yellow-200 border-yellow-400',
  'B3': 'bg-yellow-300 border-yellow-500',
  'B4': 'bg-yellow-400 border-yellow-600',
  'C1': 'bg-gray-200 border-gray-400',
  'C2': 'bg-gray-300 border-gray-500',
  'C3': 'bg-gray-400 border-gray-600',
  'C4': 'bg-gray-500 border-gray-700',
  'D2': 'bg-orange-200 border-orange-400',
  'D3': 'bg-orange-300 border-orange-500',
  'D4': 'bg-orange-400 border-orange-600',
};

const ColorConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, confirmColor, getColorConfirmsByOrderId } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const [selectedShade, setSelectedShade] = useState<string>('');
  const [remark, setRemark] = useState('');
  
  const order = id ? getOrderById(id) : undefined;
  const colorHistory = id ? getColorConfirmsByOrderId(id) : [];
  
  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }
  
  const handleConfirm = () => {
    if (!selectedShade || !id) return;
    confirmColor(id, selectedShade, remark);
    navigate(`/order/${id}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/order/${id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回详情
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">色号确认</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">订单信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="font-medium text-gray-800">{order.orderNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">患者姓名</p>
                  <p className="font-medium text-gray-800">{order.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">交付日期</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(order.deliveryDate), 'yyyy年MM月dd日', { locale: zhCN })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">当前色号</p>
                  <p className="font-medium text-gray-800">{order.shade || '未确认'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">选择色号</h2>
            <p className="text-sm text-gray-500 mb-6">请根据临床照片和口扫数据选择最合适的色号</p>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">A 系列 (偏红)</p>
                <div className="flex gap-3 flex-wrap">
                  {SHADE_COLORS.filter(s => s.startsWith('A')).map((shade) => (
                    <button
                      key={shade}
                      onClick={() => setSelectedShade(shade)}
                      className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        shadeColorMap[shade]
                      } ${
                        selectedShade === shade 
                          ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <span className="font-bold text-gray-800">{shade}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">B 系列 (偏黄)</p>
                <div className="flex gap-3 flex-wrap">
                  {SHADE_COLORS.filter(s => s.startsWith('B')).map((shade) => (
                    <button
                      key={shade}
                      onClick={() => setSelectedShade(shade)}
                      className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        shadeColorMap[shade]
                      } ${
                        selectedShade === shade 
                          ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <span className="font-bold text-gray-800">{shade}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">C 系列 (偏灰)</p>
                <div className="flex gap-3 flex-wrap">
                  {SHADE_COLORS.filter(s => s.startsWith('C')).map((shade) => (
                    <button
                      key={shade}
                      onClick={() => setSelectedShade(shade)}
                      className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        shadeColorMap[shade]
                      } ${
                        selectedShade === shade 
                          ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <span className="font-bold text-gray-800">{shade}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">D 系列 (偏橙)</p>
                <div className="flex gap-3 flex-wrap">
                  {SHADE_COLORS.filter(s => s.startsWith('D')).map((shade) => (
                    <button
                      key={shade}
                      onClick={() => setSelectedShade(shade)}
                      className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        shadeColorMap[shade]
                      } ${
                        selectedShade === shade 
                          ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <span className="font-bold text-gray-800">{shade}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注说明
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入色号确认的依据或说明..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                rows={3}
              />
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                操作人: <span className="font-medium text-gray-700">{currentUser?.name}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/order/${id}`)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedShade}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  确认色号 {selectedShade}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">色号确认历史</h3>
            {colorHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无确认记录</p>
            ) : (
              <div className="space-y-4">
                {colorHistory.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm font-medium">
                        <Palette className="w-3 h-3 mr-1" />
                        {record.shade}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">操作人: {record.operator}</p>
                    {record.remark && (
                      <p className="text-sm text-gray-500 mt-1">备注: {record.remark}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ 注意事项</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 请仔细比对临床照片</li>
              <li>• 考虑患者年龄和口腔环境</li>
              <li>• 特殊情况请在备注中说明</li>
              <li>• 确认后将记录操作人信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorConfirm;
