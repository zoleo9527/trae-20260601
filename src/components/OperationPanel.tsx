import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Upload } from 'lucide-react';
import { useRoleStore, useWorkflowStore } from '../stores';
import { Appeal } from '../types';

interface OperationPanelProps {
  appeal: Appeal;
  onBack: () => void;
}

export function OperationPanel({ appeal, onBack }: OperationPanelProps) {
  const [formData, setFormData] = useState({
    professionalName: '',
    siteRecord: appeal.siteRecord || '',
    opinion: appeal.professionalOpinion || '',
    conclusion: '',
    returnReason: '',
    supplementNote: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<{ fileName: string; fileUrl: string }[]>([]);
  
  const currentRole = useRoleStore((state) => state.currentRole);
  const { assignProfessional, submitInvestigation, approveAppeal, returnAppeal, supplementMaterial } = useWorkflowStore();

  const canOperate = () => {
    switch (currentRole) {
      case 'receptionist':
        return appeal.status === 'pending_assignment';
      case 'professional':
        return appeal.status === 'pending_investigation' || appeal.status === 'returned';
      case 'supervisor':
        return appeal.status === 'pending_review';
      default:
        return false;
    }
  };

  if (!canOperate()) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-gray-500 text-center">当前状态下无可用操作</p>
      </div>
    );
  }

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

  const handleSubmit = () => {
    switch (currentRole) {
      case 'receptionist':
        if (formData.professionalName) {
          assignProfessional(appeal.id, formData.professionalName);
        }
        break;
      case 'professional':
        if (appeal.status === 'returned') {
          if (formData.supplementNote) {
            supplementMaterial(
              appeal.id, 
              formData.supplementNote,
              formData.siteRecord || undefined,
              formData.opinion || undefined,
              uploadedFiles.length > 0 ? uploadedFiles : undefined
            );
          }
        } else {
          if (formData.siteRecord && formData.opinion) {
            submitInvestigation(
              appeal.id, 
              formData.siteRecord, 
              formData.opinion,
              uploadedFiles.length > 0 ? uploadedFiles : undefined
            );
          }
        }
        break;
      case 'supervisor':
        if (formData.conclusion) {
          approveAppeal(appeal.id, formData.conclusion);
        }
        break;
    }
    onBack();
  };

  const handleReturn = () => {
    if (formData.returnReason) {
      returnAppeal(appeal.id, formData.returnReason);
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4"
    >
      <div className="space-y-4">
        {currentRole === 'receptionist' && appeal.status === 'pending_assignment' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分配专业人员
            </label>
            <select
              value={formData.professionalName}
              onChange={(e) => setFormData({ ...formData, professionalName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择专业人员</option>
              <option value="李工">李工</option>
              <option value="王工">王工</option>
              <option value="张工">张工</option>
            </select>
          </div>
        )}

        {currentRole === 'professional' && appeal.status === 'pending_investigation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                现场记录
              </label>
              <textarea
                value={formData.siteRecord}
                onChange={(e) => setFormData({ ...formData, siteRecord: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入现场核查记录..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业意见
              </label>
              <textarea
                value={formData.opinion}
                onChange={(e) => setFormData({ ...formData, opinion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入专业意见..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                沟通材料（可选）
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">点击上传文件</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="investigation-file-upload"
                />
                <label
                  htmlFor="investigation-file-upload"
                  className="cursor-pointer px-3 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors inline-block text-sm font-medium mt-2"
                >
                  选择文件
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
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
          </>
        )}

        {currentRole === 'professional' && appeal.status === 'returned' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因
              </label>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">{appeal.returnReason}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                更新现场记录（可选）
              </label>
              <textarea
                value={formData.siteRecord}
                onChange={(e) => setFormData({ ...formData, siteRecord: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如需更新现场记录..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                更新专业意见（可选）
              </label>
              <textarea
                value={formData.opinion}
                onChange={(e) => setFormData({ ...formData, opinion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如需更新专业意见..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补充备注
              </label>
              <textarea
                value={formData.supplementNote}
                onChange={(e) => setFormData({ ...formData, supplementNote: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入补充材料说明..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                追加沟通材料（可选）
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">点击上传文件</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="supplement-file-upload"
                />
                <label
                  htmlFor="supplement-file-upload"
                  className="cursor-pointer px-3 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors inline-block text-sm font-medium mt-2"
                >
                  选择文件
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
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
          </>
        )}

        {currentRole === 'supervisor' && appeal.status === 'pending_review' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                复核结论
              </label>
              <textarea
                value={formData.conclusion}
                onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入复核结论..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因(可选)
              </label>
              <textarea
                value={formData.returnReason}
                onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如需退回,请填写原因..."
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回</span>
          </motion.button>

          {currentRole === 'supervisor' && formData.returnReason && (
            <motion.button
              onClick={handleReturn}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">退回</span>
            </motion.button>
          )}

          <motion.button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">提交</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}