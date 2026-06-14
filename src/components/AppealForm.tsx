import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Upload } from 'lucide-react';
import { useAppealStore, useRoleStore } from '../stores';

interface AppealFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppealForm({ isOpen, onClose }: AppealFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    appealContent: '',
    oldLedgerInfo: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<{ fileName: string; fileUrl: string }[]>([]);
  
  const createAppeal = useAppealStore((state) => state.createAppeal);
  const loadAppeals = useAppealStore((state) => state.loadAppeals);
  const currentUserName = useRoleStore((state) => state.currentUserName);

  const handleSubmit = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.appealContent || !formData.oldLedgerInfo) {
      alert('请填写完整信息');
      return;
    }

    const appealData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      appealContent: formData.appealContent,
      oldLedgerInfo: formData.oldLedgerInfo,
      status: 'pending_assignment' as const,
      isException: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    createAppeal(appealData, uploadedFiles);

    setFormData({
      customerName: '',
      customerPhone: '',
      appealContent: '',
      oldLedgerInfo: ''
    });
    setUploadedFiles([]);
    
    loadAppeals();
    
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFiles(prev => [...prev, {
          fileName: file.name,
          fileUrl: event.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">录入客户申诉</h2>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    客户姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入客户姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入联系电话"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    旧台账信息 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.oldLedgerInfo}
                    onChange={(e) => setFormData({ ...formData, oldLedgerInfo: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="保单号、出险日期、定损金额等..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    客户申诉内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.appealContent}
                    onChange={(e) => setFormData({ ...formData, appealContent: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请详细描述客户申诉内容..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    沟通材料（可选）
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">点击或拖拽上传文件</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="appeal-file-upload"
                    />
                    <label
                      htmlFor="appeal-file-upload"
                      className="cursor-pointer px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors inline-block text-sm font-medium"
                    >
                      选择文件
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                            {file.fileName}
                          </span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  取消
                </motion.button>
                <motion.button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send className="w-4 h-4" />
                  <span className="font-medium">提交申诉</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}