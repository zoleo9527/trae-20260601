import { useState } from 'react';
import { ExceptionType, Ticket } from '../types';
import { useTicketStore } from '../store/ticketStore';
import { releaseReasons, mockUsers } from '../data/mockData';
import { FileText, MessageSquare, Send, AlertTriangle, CheckCircle2, ArrowRight, Clock } from 'lucide-react';

interface ReleaseFormProps {
    ticket: Ticket;
    exceptionType: ExceptionType;
    onSubmit: () => void;
}

export const ReleaseForm = ({ ticket, exceptionType, onSubmit }: ReleaseFormProps) => {
    const { currentUser, createReleaseRecord } = useTicketStore();
    const [selectedReason, setSelectedReason] = useState('');
    const [remarks, setRemarks] = useState('');
    
    const supervisors = mockUsers.filter(u => u.role === 'supervisor');
    const isGateOffline = exceptionType === 'gate_offline';
    
    const handleSubmit = () => {
        if (!selectedReason) return;
        
        createReleaseRecord({
            exception_type: exceptionType,
            release_reason: selectedReason,
            approver: '',
            checker: currentUser?.name || '',
            remarks,
            status: 'pending'
        }, ticket);
        
        onSubmit();
    };

    const approvalFlow = [
        { step: '1', label: '检票员记录', status: 'done' },
        { step: '2', label: '主管审批', status: 'pending' },
        { step: '3', label: '游客入园', status: 'pending' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-4 ${isGateOffline ? 'bg-amber-50' : 'bg-blue-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">
                            {isGateOffline ? '闸机离线异常' : '异常放行申请'}
                        </span>
                    </div>
                    <span className="text-sm text-blue-600">
                        需主管审批后放行
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-center space-x-2 mb-6">
                    {approvalFlow.map((item, index) => (
                        <div key={item.step} className="flex items-center">
                            <div className={`flex items-center space-x-2 ${index > 0 ? 'ml-2' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    item.status === 'done' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {item.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                                </div>
                                <span className={`text-sm font-medium ${
                                    item.status === 'done' ? 'text-gray-800' : 'text-gray-500'
                                }`}>
                                    {item.label}
                                </span>
                            </div>
                            {index < approvalFlow.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-gray-300 ml-3" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                            <FileText className="w-4 h-4 mr-2 text-blue-500" />
                            选择放行原因
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {releaseReasons.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setSelectedReason(reason)}
                                    className={`p-3 rounded-lg text-left text-sm transition-all duration-200 border-2 ${
                                        selectedReason === reason
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>

                    {supervisors.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-yellow-800">审批主管</label>
                                <Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {supervisors.map((supervisor) => (
                                    <div
                                        key={supervisor.id}
                                        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-yellow-200"
                                    >
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                                            {supervisor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{supervisor.name}</p>
                                            <p className="text-xs text-gray-500">票务主管</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-yellow-700 mt-2">申请将发送给主管审批，请等待确认</p>
                        </div>
                    )}

                    <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                            <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                            现场备注
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="请输入现场情况备注，如天气状况、游客特殊需求等..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                            rows={3}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason}
                            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all duration-200 ${
                                selectedReason
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                            <span className="text-lg">提交审批申请</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
