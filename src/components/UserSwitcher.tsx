import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { User } from '../types';
import { User as UserIcon, ChevronDown, Shield, Headphones, Check } from 'lucide-react';

export const UserSwitcher = () => {
    const { currentUser, users, setCurrentUser } = useTicketStore();
    const [isOpen, setIsOpen] = useState(false);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'checker': return Shield;
            case 'supervisor': return Shield;
            case 'customer_service': return Headphones;
            default: return UserIcon;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'checker': return '检票员';
            case 'supervisor': return '主管';
            case 'customer_service': return '客服';
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'checker': return 'bg-blue-100 text-blue-700';
            case 'supervisor': return 'bg-yellow-100 text-yellow-700';
            case 'customer_service': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'checker': return 'bg-blue-500';
            case 'supervisor': return 'bg-yellow-500';
            case 'customer_service': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const groupedUsers = users.reduce((acc, user) => {
        if (!acc[user.role]) {
            acc[user.role] = [];
        }
        acc[user.role].push(user);
        return acc;
    }, {} as Record<string, User[]>);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-blue-700 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
                <div className={`w-8 h-8 ${getRoleBadgeColor(currentUser?.role || '')} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {currentUser?.name.charAt(0)}
                </div>
                <div className="text-left">
                    <p className="font-medium text-sm">{currentUser?.name}</p>
                    <p className={`text-xs px-2 py-0.5 rounded ${getRoleColor(currentUser?.role || '')}`}>
                        {getRoleLabel(currentUser?.role || '')}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-500">选择身份</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {Object.entries(groupedUsers).map(([role, usersInRole]) => (
                            <div key={role} className="border-b border-gray-100 last:border-b-0">
                                <div className="px-3 py-2 bg-gray-50">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRoleColor(role)}`}>
                                        {getRoleLabel(role)}
                                    </span>
                                </div>
                                {usersInRole.map((user) => {
                                    const RoleIcon = getRoleIcon(user.role);
                                    const isSelected = currentUser?.id === user.id;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setCurrentUser(user);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 transition-colors ${
                                                isSelected ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className={`w-9 h-9 ${getRoleBadgeColor(user.role)} rounded-full flex items-center justify-center text-white`}>
                                                <RoleIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5 text-blue-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};