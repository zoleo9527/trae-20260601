import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, Plus, Save, Calendar, MapPin, Users } from 'lucide-react';
import { useDocumentStore } from '../stores';
import { DocumentStatusLabels, DocumentStatus, QARecord, Evaluation } from '../types';
import clsx from 'clsx';

const statusConfig: Record<DocumentStatus, { color: string; icon: any; nextAction?: string }> = {
  pending: { color: 'gray', icon: FileText, nextAction: '开始编制' },
  drafting: { color: 'blue', icon: Clock, nextAction: '提交审核' },
  review: { color: 'yellow', icon: Clock, nextAction: '审核通过' },
  published: { color: 'green', icon: CheckCircle },
  rejected: { color: 'red', icon: AlertCircle, nextAction: '重新编制' },
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDocument, fetchDocument, updateDocument, addQARecord, scheduleEvaluation, loading } = useDocumentStore();
  
  const [content, setContent] = useState('');
  const [showQAModal, setShowQAModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [qaForm, setQaForm] = useState({ question: '', answer: '' });
  const [evalForm, setEvalForm] = useState({ scheduledAt: '', location: '', evaluators: '' });

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentDocument) {
      setContent(currentDocument.content || '');
    }
  }, [currentDocument]);

  const handleSaveContent = async () => {
    if (!id) return;
    try {
      await updateDocument(id, { content });
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleAddQA = async () => {
    if (!id || !qaForm.question.trim() || !qaForm.answer.trim()) return;
    try {
      await addQARecord(id, qaForm);
      setShowQAModal(false);
      setQaForm({ question: '', answer: '' });
    } catch (error) {
      console.error('添加答疑失败:', error);
    }
  };

  const handleScheduleEvaluation = async () => {
    if (!id || !evalForm.scheduledAt || !evalForm.location || !evalForm.evaluators.trim()) return;
    try {
      await scheduleEvaluation(id, {
        scheduledAt: evalForm.scheduledAt,
        location: evalForm.location,
        evaluators: evalForm.evaluators.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowEvalModal(false);
      setEvalForm({ scheduledAt: '', location: '', evaluators: '' });
    } catch (error) {
      console.error('安排评标失败:', error);
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const config = statusConfig[currentDocument.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentDocument.projectName || '招标文件编制'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">文档编号: {currentDocument.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                `bg-${config.color}-100 text-${config.color}-700`
              )}>
                <StatusIcon className="w-4 h-4" />
                {DocumentStatusLabels[currentDocument.status]}
              </span>
              {config.nextAction && (
                <button
                  onClick={handleSaveContent}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? '保存中...' : config.nextAction}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">招标文件内容</h3>
              <button
                onClick={handleSaveContent}
                disabled={loading || currentDocument.status === 'published'}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3 h-3" />
                保存内容
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={currentDocument.status === 'published'}
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
              placeholder="请输入招标文件内容..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">答疑记录</h3>
                <button
                  onClick={() => setShowQAModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>
              <div className="p-4">
                {currentDocument.qaRecords.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">暂无答疑记录</p>
                ) : (
                  <div className="space-y-4">
                    {currentDocument.qaRecords.map((qa: QARecord) => (
                      <div key={qa.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="mb-2">
                          <span className="text-xs text-primary-600 font-medium">问:</span>
                          <p className="text-sm text-gray-900 mt-1">{qa.question}</p>
                        </div>
                        <div>
                          <span className="text-xs text-green-600 font-medium">答:</span>
                          <p className="text-sm text-gray-700 mt-1">{qa.answer}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            {qa.answeredBy} • {new Date(qa.answeredAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">评标安排</h3>
                {!currentDocument.evaluation && (
                  <button
                    onClick={() => setShowEvalModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    安排
                  </button>
                )}
              </div>
              <div className="p-4">
                {currentDocument.evaluation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(currentDocument.evaluation.scheduledAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{currentDocument.evaluation.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {currentDocument.evaluation.evaluators.map((evalName, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {evalName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">暂无评标安排</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加答疑记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">问题</label>
                <textarea
                  value={qaForm.question}
                  onChange={(e) => setQaForm({ ...qaForm, question: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入问题内容"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">答复</label>
                <textarea
                  value={qaForm.answer}
                  onChange={(e) => setQaForm({ ...qaForm, answer: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入答复内容"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowQAModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddQA}
                disabled={!qaForm.question.trim() || !qaForm.answer.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">安排评标</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评标时间</label>
                <input
                  type="datetime-local"
                  value={evalForm.scheduledAt}
                  onChange={(e) => setEvalForm({ ...evalForm, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评标地点</label>
                <input
                  type="text"
                  value={evalForm.location}
                  onChange={(e) => setEvalForm({ ...evalForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="如：评标室A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评委（多个用逗号分隔）</label>
                <input
                  type="text"
                  value={evalForm.evaluators}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluators: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="如：评委1, 评委2, 评委3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEvalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleScheduleEvaluation}
                disabled={!evalForm.scheduledAt || !evalForm.location || !evalForm.evaluators.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                确认安排
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
