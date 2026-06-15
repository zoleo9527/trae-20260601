import { useState, useEffect } from 'react';
import { Users, Phone, Plus, Search, Edit2, Trash2, UserPlus } from 'lucide-react';
import axios from 'axios';
const roleColors = {
 导购: 'bg-yellow-100 text-yellow-800',
 量尺师: 'bg-blue-100 text-blue-800',
 裁剪工: 'bg-indigo-100 text-indigo-800',
 缝纫工: 'bg-pink-100 text-pink-800',
 熨烫工: 'bg-cyan-100 text-cyan-800',
 安装师傅: 'bg-emerald-100 text-emerald-800',
 采购: 'bg-orange-100 text-orange-800'
};
const roles = ['导购', '量尺师', '裁剪工', '缝纫工', '熨烫工', '安装师傅', '采购'];
function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: '导购', phone: '' });
  useEffect(() => {
    fetchStaff();
  }, []);
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
    setLoading(false);
  };
  const handleAdd = async () => {
    try {
      await axios.post('/api/staff', newStaff);
      fetchStaff();
      setShowAddModal(false);
      setNewStaff({ name: '', role: '导购', phone: '' });
    } catch (error) {
      console.error('Failed to add staff:', error);
    }
  };
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesRole = !roleFilter || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const roleStats = roles.map((role) => ({
    role,
    count: staff.filter((s) => s.role === role).length
  }));
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">人员管理</h1>
          <p className="text-slate-500">管理门店员工信息</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <Plus size={18} />
          <span>添加员工</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {roleStats.map((stat) => (
          <div
            key={stat.role}
            className="bg-white rounded-xl shadow-sm p-4 text-center"
          >
            <p className="text-sm text-slate-500 mb-1">{stat.role}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索员工姓名、电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">全部职位</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">姓名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">职位</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">联系电话</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">入职时间</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">加载中...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">暂无员工</td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role] || 'bg-slate-100 text-slate-800'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Phone size={14} />
                        <span>{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(member.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <UserPlus size={20} className="text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">添加员工</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">姓名</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="请输入员工姓名"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">职位</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">联系电话</label>
                <input
                  type="text"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="请输入联系电话"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewStaff({ name: '', role: '导购', phone: '' });
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;
