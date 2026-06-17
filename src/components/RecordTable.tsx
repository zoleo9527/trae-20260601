import { ReleaseRecord } from '../types';
import { getExceptionLabel, getStatusLabel } from '../data/mockData';
import { Eye } from 'lucide-react';

interface RecordTableProps {
    records: ReleaseRecord[];
    onViewDetail: (record: ReleaseRecord) => void;
}

export const RecordTable = ({ records, onViewDetail }: RecordTableProps) => {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">记录ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">票号</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">游客</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">异常类型</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">处理人</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">审批人</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">状态</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">时间</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.map((record) => (
                            <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-mono text-blue-600">
                                    {record.record_id}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-800">
                                    {record.ticket_id}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {record.checker}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                        {getExceptionLabel(record.exception_type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {record.checker}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {record.approver || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[record.status]}`}>
                                        {getStatusLabel(record.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {record.created_at}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onViewDetail(record)}
                                        className="flex items-center justify-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-sm">详情</span>
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