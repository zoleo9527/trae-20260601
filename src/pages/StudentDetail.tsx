import { useParams, useNavigate } from 'react-router-dom';
import { mockStudents, mockClasses, mockCommunications, mockPerformances, mockTransferApplications, getStatusText, getStatusColor } from '../data/mockData';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const student = mockStudents.find(s => s.id === id);
  const currentClass = mockClasses.find(c => c.id === student?.currentClassId);
  const studentCommunications = mockCommunications.filter(c => c.studentId === id);
  const studentPerformances = mockPerformances.filter(p => p.studentId === id);
  const activeTransfer = mockTransferApplications.find(t => t.studentId === id && t.status !== 'completed' && t.status !== 'rejected');

  if (!student) {
    return <div className="empty-state">未找到学员信息</div>;
  }

  type TimelineItem = {
    id: string;
    type: 'enroll' | 'communication' | 'performance' | 'trial' | 'price' | 'parent';
    date: string;
    title: string;
    icon: string;
    content: string;
    meta?: string;
    rating?: number;
  };

  const generateTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    items.push({
      id: 'enroll-' + student.id,
      type: 'enroll',
      date: student.enrollDate + ' 10:00:00',
      title: '报名入班',
      icon: '📝',
      content: student.name + ' 报名加入 ' + (currentClass?.name || '') + '，共 ' + student.totalHours + ' 课时',
      meta: '课程顾问 · 李顾问',
    });

    studentCommunications.forEach(comm => {
      items.push({
        id: comm.id,
        type: 'communication',
        date: comm.createdAt,
        title: comm.type + '记录',
        icon: '💬',
        content: comm.content,
        meta: comm.operatorName + ' · ' + comm.operatorRole,
      });
    });

    studentPerformances.forEach(perf => {
      items.push({
        id: perf.id,
        type: 'performance',
        date: perf.date + ' 00:00:00',
        title: '课堂表现',
        icon: '🎨',
        content: perf.performance + '\n\n技能进展：' + perf.skillProgress + '\n老师评语：' + perf.teacherComment,
        meta: perf.className + ' · ' + perf.teacherName + ' · ' + perf.attendance,
        rating: perf.overallRating,
      });
    });

    if (activeTransfer) {
      const transfer = activeTransfer;

      if (transfer.trialDate && transfer.trialFeedback) {
        items.push({
          id: 'trial-' + transfer.id,
          type: 'trial',
          date: transfer.trialDate + ' 00:00:00',
          title: '试听反馈',
          icon: '🎯',
          content: '试听班级：' + transfer.toClassName + '\n试听结果：' + (transfer.trialResult === 'pass' ? '✅ 通过' : transfer.trialResult === 'fail' ? '❌ 不通过' : '⏳ 待安排') + '\n反馈内容：' + (transfer.trialFeedback || '暂无'),
          meta: '试听老师：' + (transfer.trialTeacherName || '待安排'),
        });
      }

      if (transfer.priceDifference !== 0) {
        items.push({
          id: 'price-' + transfer.id,
          type: 'price',
          date: transfer.priceConfirmedAt || transfer.createdAt,
          title: '课时差价确认',
          icon: '💰',
          content: '原班级：' + transfer.fromClassName + '（剩余 ' + transfer.remainingHoursFrom + ' 课时）\n目标班级：' + transfer.toClassName + '\n课时差价：' + (transfer.priceDifference >= 0 ? '+' : '') + '¥' + transfer.priceDifference + '\n' + (transfer.priceDifference >= 0 ? '需补交差额' : '将退还差额'),
          meta: transfer.priceConfirmed ? '已确认 · ' + (transfer.priceConfirmedBy || '系统') : '待确认',
        });
      }

      if (transfer.parentConfirmed) {
        items.push({
          id: 'parent-' + transfer.id,
          type: 'parent',
          date: transfer.parentConfirmedAt || new Date().toISOString(),
          title: '家长确认',
          icon: '✅',
          content: '家长已确认同意调班申请。\n调班方向：' + transfer.fromClassName + ' → ' + transfer.toClassName + '\n调班原因：' + transfer.reason,
          meta: '家长：' + student.parentName,
        });
      }
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineItems = generateTimeline();
  const renderStars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <img src={student.avatar} alt="" style={{ width: 80, height: 80, borderRadius: '50%' }} />
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
                  {student.name}
                  <span className="text-sm text-gray" style={{ marginLeft: 12 }}>{student.gender} · {student.age}岁</span>
                </h2>
                <div className="text-sm text-gray" style={{ marginBottom: 8 }}>家长：{student.parentName} · {student.parentPhone}</div>
                <div className="flex gap-2">
                  <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>{currentClass?.name}</span>
                  {activeTransfer && (
                    <span className="badge" style={{ background: getStatusColor(activeTransfer.status) + '20', color: getStatusColor(activeTransfer.status) }}>
                      {getStatusText(activeTransfer.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => navigate('/students')}>返回列表</button>
              <button className="btn btn-primary" onClick={() => navigate(activeTransfer ? `/transfer/${activeTransfer.id}` : `/transfer/new/${student.id}`)}>
                {activeTransfer ? '继续调班流程' : '发起调班申请'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3 mb-4">
        <div className="stat-card">
          <div className="stat-value">{student.remainingHours}</div>
          <div className="stat-label">剩余课时 / {student.totalHours} 总课时</div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${(student.remainingHours / student.totalHours) * 100}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{studentPerformances.length}</div>
          <div className="stat-label">课堂记录</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{studentCommunications.length}</div>
          <div className="stat-label">沟通记录</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">档案时间线（报名 · 沟通 · 课堂表现 · 试听 · 课时 · 家长确认）</div>
        <div className="card-body">
          <div className="unified-timeline">
            {timelineItems.map(item => (
              <div key={item.id} className="timeline-item">
                <div className={`timeline-dot ${item.type}`}>{item.icon}</div>
                <div className="timeline-header">
                  <div className="timeline-type">
                    <strong>{item.title}</strong>
                    {item.rating && <span className="timeline-rating ml-2">{renderStars(item.rating)}</span>}
                  </div>
                  <div className="timeline-date">{item.date}</div>
                </div>
                <div className="timeline-content">{item.content}</div>
                {item.meta && <div className="timeline-meta">{item.meta}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
