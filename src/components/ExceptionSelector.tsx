import { ExceptionType } from '../types';
import { exceptionTypes } from '../data/mockData';
import { Clock, Users, WifiOff, CreditCard, Check } from 'lucide-react';

interface ExceptionSelectorProps {
    selected: ExceptionType | null;
    onChange: (value: ExceptionType) => void;
}

const iconMap: Record<string, typeof Clock> = {
    expired: Clock,
    team_mismatch: Users,
    gate_offline: WifiOff,
    id_verify_fail: CreditCard
};

const colorMap: Record<string, string> = {
    expired: 'bg-red-500',
    team_mismatch: 'bg-orange-500',
    gate_offline: 'bg-amber-500',
    id_verify_fail: 'bg-blue-500'
};

const hoverColorMap: Record<string, string> = {
    expired: 'hover:bg-red-600',
    team_mismatch: 'hover:bg-orange-600',
    gate_offline: 'hover:bg-amber-600',
    id_verify_fail: 'hover:bg-blue-600'
};

const borderColorMap: Record<string, string> = {
    expired: 'border-red-500 shadow-red-200',
    team_mismatch: 'border-orange-500 shadow-orange-200',
    gate_offline: 'border-amber-500 shadow-amber-200',
    id_verify_fail: 'border-blue-500 shadow-blue-200'
};

const bgColorMap: Record<string, string> = {
    expired: 'bg-red-50 border-red-200',
    team_mismatch: 'bg-orange-50 border-orange-200',
    gate_offline: 'bg-amber-50 border-amber-200',
    id_verify_fail: 'bg-blue-50 border-blue-200'
};

const descriptionMap: Record<string, string> = {
    expired: '套票有效期已过',
    team_mismatch: '游客不在团队名单',
    gate_offline: '闸机通信中断',
    id_verify_fail: '证件信息不匹配'
};

export const ExceptionSelector = ({ selected, onChange }: ExceptionSelectorProps) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">选择异常类型</h3>
                {selected && (
                    <span className="text-sm text-gray-500">已选择: {exceptionTypes.find(e => e.value === selected)?.label}</span>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {exceptionTypes.map((exception) => {
                    const Icon = iconMap[exception.value];
                    const isSelected = selected === exception.value;
                    return (
                        <button
                            key={exception.value}
                            onClick={() => onChange(exception.value)}
                            className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 border-2 ${
                                isSelected
                                    ? `${colorMap[exception.value]} text-white border-transparent shadow-lg scale-105`
                                    : `${bgColorMap[exception.value]} text-gray-700 ${hoverColorMap[exception.value]} hover:text-white hover:shadow-md`
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                                isSelected ? 'bg-white/20' : 'bg-white shadow-sm'
                            }`}>
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : colorMap[exception.value]}`} />
                            </div>
                            <span className="font-semibold text-sm">{exception.label}</span>
                            <span className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                {descriptionMap[exception.value]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};