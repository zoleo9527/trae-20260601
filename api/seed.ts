import { insertStudent, insertUser, insertKey, saveData, resetData } from './db';

resetData();

// 学生数据
insertStudent({ id: 'S001', name: '张三', student_id: '2024001', dorm_room: '3号楼101室', counselor: '李明华', phone: '13800138001' });
insertStudent({ id: 'S002', name: '李四', student_id: '2024002', dorm_room: '3号楼101室', counselor: '李明华', phone: '13800138002' });
insertStudent({ id: 'S003', name: '王五', student_id: '2024003', dorm_room: '3号楼102室', counselor: '李明华', phone: '13800138003' });
insertStudent({ id: 'S004', name: '赵六', student_id: '2024004', dorm_room: '3号楼102室', counselor: '王辅导员', phone: '13800138004' });
insertStudent({ id: 'S005', name: '孙七', student_id: '2024005', dorm_room: '3号楼103室', counselor: '王辅导员', phone: '13800138005' });

// 用户数据
insertUser({ id: 'U001', name: '张建国', role: 'dorm_officer' });
insertUser({ id: 'U002', name: '李明华', role: 'counselor' });
insertUser({ id: 'U003', name: '王师傅', role: 'repair' });

// 钥匙台账
insertKey({ id: 'K001', student_id: '2024001', key_number: 'KEY-101-01', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K002', student_id: '2024002', key_number: 'KEY-101-02', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K003', student_id: '2024003', key_number: 'KEY-102-01', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K004', student_id: '2024004', key_number: 'KEY-102-02', status: '丢失', issued_at: '2024-09-01' });
insertKey({ id: 'K005', student_id: '2024005', key_number: 'KEY-103-01', status: '正常', issued_at: '2024-09-01' });

saveData();
console.log('种子数据写入完成');
