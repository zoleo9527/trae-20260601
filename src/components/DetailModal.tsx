import { ReleaseRecord } from '../types';
import { getExceptionLabel, getStatusLabel } from '../data/mockData';
import { X, Ticket, AlertTriangle, User, CheckCircle, Clock } from 'lucide-react';

interface DetailModalProps {
    record: ReleaseRecord;
    onClose: () => void;
}

export const DetailModal = ({ record, onClose }: DetailModalProps) => {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">放行记录详情</h2>
                            <p className="text-sm text-gray-500">{record.record_id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">状态</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[record.status]}`}>
                            {getStatusLabel(record.status)}
                        </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <span className="font-medium text-gray-800">异常信息</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">异常类型</span>
                                <span className="font-medium">{getExceptionLabel(record.exception_type)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">放行原因</span>
                                <span className="font-medium">{record.release_reason}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <User className="w-5 h-5 text-blue-500" />
                            <span className="font-medium text-gray-800">人员信息</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">票号</span>
                                <span className="font-medium font-mono">{record.ticket_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">处理人</span>
                                <span className="font-medium">{record.checker}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">审批人</span>
                                <span className="font-medium">{record.approver || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {record.remarks && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="font-medium text-gray-800">现场备注</span>
                            </div>
                            <p className="text-sm text-gray-700">{record.remarks}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{record.created_at}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};