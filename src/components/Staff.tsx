import { useState, useEffect } from 'react';
import { Search, Filter, User, Phone, Mail, MapPin, Edit2, Trash2, Plus } from 'lucide-react';
import { getStaff } from '../api';
import { Staff as StaffType } from '../types';

export default function Staff() {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const data = await getStaff();
    setStaff(data);
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchesRole = !roleFilter || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<string, string> = {
    '客服': 'bg-blue-100 text-blue-600',
    '家政员': 'bg-green-100 text-green-600',
    '质检主管': 'bg-purple-100 text-purple-600',
  };

  const statusColors: Record<string, string> = {
    '在线': 'bg-green-500',
    '离线': 'bg-gray-300',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">人员管理</h2>
          <p className="text-gray-500 mt-1">管理公司员工信息</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>新增人员</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索姓名、工号、电话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部角色</option>
                  <option value="客服">客服</option>
                  <option value="家政员">家政员</option>
                  <option value="质检主管">质检主管</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredStaff.map((s) => (
            <div key={s.id} className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${roleColors[s.role]}`}>
                      {s.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{s.staffNo}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${statusColors[s.status]}`}></span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{s.phone}</span>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
