import { ReleaseRecord } from '../types';
import { getExceptionLabel, getStatusLabel } from '../data/mockData';
import { Eye, User, Ticket, Building2 } from 'lucide-react';

interface RecordTableProps {
    records: ReleaseRecord[];
    onViewDetail: (record: ReleaseRecord) => void;
}

const maskId = (id: string): string => {
    if (id.length >= 18) {
        return id.slice(0, 6) + '**********' + id.slice(-4);
    }
    return id;
};

export const RecordTable = ({ records, onViewDetail }: RecordTableProps) => {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    };

    const exceptionColors: Record<string, string> = {
        expired: 'bg-red-50 text-red-700',
        team_mismatch: 'bg-orange-50 text-orange-700',
        gate_offline: 'bg-amber-50 text-amber-700',
        id_verify_fail: 'bg-blue-50 text-blue-700'
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">记录ID</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">票号/票种</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">游客信息</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">异常类型</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">处理/审批</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">状态</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">时间</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.map((record) => (
                            <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono text-blue-600">
                                    {record.record_id}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div className="flex items-center space-x-2">
                                        <Ticket className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-mono text-gray-800 truncate">{record.ticket_id}</p>
                                            <p className="text-xs text-gray-500">{record.ticket_type}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-gray-800">{record.visitor_name}</p>
                                            <p className="text-xs text-gray-500">{maskId(record.visitor_id)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${exceptionColors[record.exception_type] || 'bg-gray-50 text-gray-700'}`}>
                                        {getExceptionLabel(record.exception_type)}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div>
                                        <div className="flex items-center space-x-1">
                                            <Building2 className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs sm:text-sm text-gray-700">处理: {record.checker}</span>
                                        </div>
                                        {record.approver && (
                                            <div className="text-xs text-gray-500 mt-1">审批: {record.approver}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColors[record.status]}`}>
                                        {getStatusLabel(record.status)}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                                    {record.created_at}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <button
                                        onClick={() => onViewDetail(record)}
                                        className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                    >
                                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="text-xs sm:text-sm">详情</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};