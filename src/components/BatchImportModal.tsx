import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface BatchImportModalProps {
  onClose: () => void;
}

interface ImportRow {
  title: string;
  description: string;
  category: string;
  dormitory: string;
  roomNumber: string;
  reporter: string;
  reporterPhone?: string;
  priority: 'low' | 'medium' | 'high';
}

export function BatchImportModal({ onClose }: BatchImportModalProps) {
  const { batchImportOrders } = useStore();
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTemplateCopy = () => {
    const template = `标题,描述,分类,宿舍楼,房间号,报修人,联系电话,优先级
1号楼302宿舍灯管损坏,宿舍主灯管闪烁有时不亮,电器维修,1号楼,302,张三,13800138001,中
2号楼105水龙头漏水,卫生间水龙头关不严滴水,水暖维修,2号楼,105,李四,,高`;
    navigator.clipboard.writeText(template);
  };

  const handleTextParse = () => {
    const text = textareaRef.current?.value;
    if (!text?.trim()) {
      setError('请输入或粘贴CSV格式的数据');
      return;
    }

    try {
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const requiredHeaders = ['标题', '描述', '分类', '宿舍楼', '房间号', '报修人', '优先级'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setError(`缺少必要列：${missingHeaders.join('、')}`);
        return;
      }

      const data: ImportRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 7) continue;

        const row: ImportRow = {
          title: values[headers.indexOf('标题')] || '',
          description: values[headers.indexOf('描述')] || '',
          category: values[headers.indexOf('分类')] || '其他维修',
          dormitory: values[headers.indexOf('宿舍楼')] || '',
          roomNumber: values[headers.indexOf('房间号')] || '',
          reporter: values[headers.indexOf('报修人')] || '',
          reporterPhone: values[headers.indexOf('联系电话')] || undefined,
          priority: (values[headers.indexOf('优先级')] === '高' ? 'high' : 
                     values[headers.indexOf('优先级')] === '低' ? 'low' : 'medium') as 'low' | 'medium' | 'high'
        };

        if (row.title && row.description && row.dormitory && row.roomNumber && row.reporter) {
          data.push(row);
        }
      }

      if (data.length === 0) {
        setError('没有解析到有效的数据行');
        return;
      }

      setImportData(data);
      setError('');
      setStep('preview');
    } catch (err) {
      setError('解析数据失败，请检查格式是否正确');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (textareaRef.current) {
        textareaRef.current.value = event.target?.result as string;
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    batchImportOrders(importData);
    setStep('success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">批量录入工单</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">批量录入说明</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 支持 CSV 格式文件导入，或直接粘贴文本</li>
                  <li>• 必须包含列：标题、描述、分类、宿舍楼、房间号、报修人、优先级</li>
                  <li>• 优先级可选值：高、中、低</li>
                  <li>• 联系电话为选填项</li>
                </ul>
                <button
                  onClick={handleTemplateCopy}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  点击复制模板格式
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传 CSV 文件
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                     onClick={() => document.getElementById('csv-upload')?.click()}>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">点击上传 CSV 文件</p>
                  <p className="text-sm text-gray-400 mt-1">或在下方文本框粘贴数据</p>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  或粘贴 CSV 数据
                </label>
                <textarea
                  ref={textareaRef}
                  placeholder="标题,描述,分类,宿舍楼,房间号,报修人,联系电话,优先级&#10;1号楼302灯管损坏,灯管闪烁不亮,电器维修,1号楼,302,张三,13800138001,中"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    成功解析 {importData.length} 条数据
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">数据预览</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">序号</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">标题</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">位置</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">分类</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">报修人</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">优先级</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                            <td className="px-3 py-2 text-gray-900 max-w-xs truncate">{row.title}</td>
                            <td className="px-3 py-2 text-gray-600">{row.dormitory} {row.roomNumber}</td>
                            <td className="px-3 py-2 text-gray-600">{row.category}</td>
                            <td className="px-3 py-2 text-gray-600">{row.reporter}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                row.priority === 'high' ? 'bg-red-100 text-red-700' :
                                row.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {row.priority === 'high' ? '高' : row.priority === 'low' ? '低' : '中'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">批量录入成功</h4>
              <p className="text-gray-500">成功导入 {importData.length} 条工单数据</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {step === 'upload' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTextParse}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>解析数据</span>
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                返回修改
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>确认导入</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
