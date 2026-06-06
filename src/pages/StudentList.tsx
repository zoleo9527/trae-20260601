import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockStudents, mockClasses, mockTransferApplications, getStatusText, getStatusColor } from '../data/mockData';

export default function StudentList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'transfer'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredStudents = mockStudents.filter(s =>
    s.name.includes(searchKeyword) || s.parentName.includes(searchKeyword)
  );

  const getStudentClass = (classId: string) => {
    return mockClasses.find(c => c.id === classId);
  };

  const getStudentTransfer = (studentId: string) => {
    return mockTransferApplications.find(t => t.studentId === studentId && t.status !== 'completed' && t.status !== 'rejected');
  };

  return (
    <div>
      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="stat-value">{mockStudents.length}</div>
          <div className="stat-label">在籍学员</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mockTransferApplications.filter(t => t.status !== 'draft' && t.status !== 'completed' && t.status !== 'rejected').length}</div>
          <div className="stat-label">调班申请中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mockClasses.length}</div>
          <div className="stat-label">开设班级</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mockTransferApplications.filter(t => t.status === 'price_confirmed').length}</div>
          <div className="stat-label">待确认差价</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部学员
        </div>
        <div className={`tab ${activeTab === 'transfer' ? 'active' : ''}`} onClick={() => setActiveTab('transfer')}>
          调班中
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span>学员列表</span>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              placeholder="搜索学员姓名或家长..."
              style={{ width: 240 }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>学员信息</th>
                <th>当前班级</th>
                <th>剩余课时</th>
                <th>入班时间</th>
                <th>调班状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const cls = getStudentClass(student.currentClassId);
                const transfer = getStudentTransfer(student.id);

                if (activeTab === 'transfer' && !transfer) return null;

                return (
                  <tr key={student.id}>
                    <td>
                      <div className="student-name">
                        <img src={student.avatar} alt="" className="avatar" />
                        <div className="student-info">
                          <h4>{student.name} <span className="text-sm text-gray">({student.gender}，{student.age}岁)</span></h4>
                          <p>家长：{student.parentName} · {student.parentPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {cls ? (
                        <div>
                          <div className="font-medium">{cls.name}</div>
                          <div className="text-sm text-gray">{cls.level} · {cls.teacherName}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{student.remainingHours} / {student.totalHours} 课时</div>
                        <div className="progress-bar mt-2" style={{ width: 120 }}>
                          <div className="progress-fill" style={{ width: `${(student.remainingHours / student.totalHours) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>{student.enrollDate}</td>
                    <td>
                      {transfer ? (
                        <span className="badge" style={{ background: getStatusColor(transfer.status) + '20', color: getStatusColor(transfer.status) }}>
                          {getStatusText(transfer.status)}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>正常</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/students/${student.id}`)}>
                          查看档案
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(transfer ? `/transfer/${transfer.id}` : `/transfer/new/${student.id}`)}>
                          {transfer ? '继续调班' : '申请调班'}
                        </button>
                      </div>
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
}
