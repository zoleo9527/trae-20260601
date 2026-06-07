import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Wallet, TrendingUp, Crown } from 'lucide-react';
import { useMemberStore } from '../stores/memberStore';
import { formatDateTime } from '../utils/storage';

const MemberList: React.FC = () => {
  const navigate = useNavigate();
  const { members, checkBalanceConsistency } = useMemberStore();
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter((m) =>
    m.name.includes(search) || m.phone.includes(search)
  );

  const levelColors: Record<string, string> = {
    '金卡': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    '银卡': 'text-slate-300 bg-slate-500/10 border-slate-500/30',
    '普通': 'text-slate-400 bg-slate-700/10 border-slate-700/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索会员姓名、手机号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm w-72 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          新增会员
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">会员总数</span>
          </div>
          <p className="text-3xl font-bold">{members.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">总余额</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            ¥{members.reduce((sum, m) => sum + m.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm">累计消费</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">
            ¥{members.reduce((sum, m) => sum + m.totalSpent, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">会员列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 font-medium text-slate-400">会员信息</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">等级</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">余额</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">累计消费</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">账务状态</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const { consistent } = checkBalanceConsistency(member.id);
                return (
                  <tr
                    key={member.id}
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${levelColors[member.level] || ''}`}>
                        <Crown className="w-3 h-3" />
                        {member.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-emerald-400">¥{member.balance.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-300">¥{member.totalSpent.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      {consistent ? (
                        <span className="text-emerald-400 text-xs">正常</span>
                      ) : (
                        <span className="text-red-400 text-xs">账务异常</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {formatDateTime(member.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberList;
