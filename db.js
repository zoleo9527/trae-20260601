const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
    const now = new Date().toISOString();
    const tenMinAgo = new Date(Date.now() - 600000).toISOString();
    
    const classIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    const mealIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    const feedbackIds = [uuidv4(), uuidv4(), uuidv4()];
    
    const initData = {
      classes: [
        { id: classIds[0], name: '一年级1班', grade: '一年级', teacher: '张老师', students: 45, createdAt: now },
        { id: classIds[1], name: '一年级2班', grade: '一年级', teacher: '李老师', students: 43, createdAt: now },
        { id: classIds[2], name: '二年级1班', grade: '二年级', teacher: '王老师', students: 42, createdAt: now },
        { id: classIds[3], name: '三年级1班', grade: '三年级', teacher: '赵老师', students: 40, createdAt: now },
      ],
      meals: [
        { id: mealIds[0], classId: classIds[0], mealDate: today, mealType: '午餐', quantity: 45, receivedBy: '张老师', receivedAt: tenMinAgo, status: 'DELIVERED', notes: '全员就餐，无异常', archived: false, archivedAt: null, archivedBy: null, createdAt: tenMinAgo },
        { id: mealIds[1], classId: classIds[1], mealDate: today, mealType: '午餐', quantity: 42, receivedBy: '李老师', receivedAt: tenMinAgo, status: 'DELIVERED', notes: '1人请假', archived: false, archivedAt: null, archivedBy: null, createdAt: tenMinAgo },
        { id: mealIds[2], classId: classIds[2], mealDate: yesterday, mealType: '午餐', quantity: 40, receivedBy: '王老师', receivedAt: tenMinAgo, status: 'DELIVERED', notes: '2人请假未取餐', archived: false, archivedAt: null, archivedBy: null, createdAt: tenMinAgo },
        { id: mealIds[3], classId: classIds[3], mealDate: dayBefore, mealType: '午餐', quantity: 40, receivedBy: '赵老师', receivedAt: tenMinAgo, status: 'DELIVERED', notes: '全员就餐，历史归档样例', archived: true, archivedAt: now, archivedBy: '食堂管理员', createdAt: tenMinAgo },
      ],
      feedbacks: [
        { id: feedbackIds[0], classId: classIds[1], mealRecordId: mealIds[1], mealDate: today, mealType: '午餐', feedbackType: 'MISSING', description: '本班实际43人，只收到42份，李明同学没有领到午餐', reportedBy: '李老师', reportedAt: now, status: 'PENDING', handledBy: null, handledAt: null, handleNotes: null, archived: false, archivedAt: null, archivedBy: null, createdAt: now },
        { id: feedbackIds[1], classId: classIds[2], mealRecordId: mealIds[2], mealDate: yesterday, mealType: '午餐', feedbackType: 'QUALITY', description: '昨天的米饭有点硬，部分学生反映吃不惯', reportedBy: '王老师', reportedAt: now, status: 'RESOLVED', handledBy: '食堂管理员', handledAt: now, handleNotes: '已反馈给后厨，今天改善米饭软硬程度', archived: false, archivedAt: null, archivedBy: null, createdAt: now },
        { id: feedbackIds[2], classId: classIds[3], mealRecordId: mealIds[3], mealDate: dayBefore, mealType: '午餐', feedbackType: 'MISSING', description: '少了1份，已当场补餐', reportedBy: '赵老师', reportedAt: now, status: 'RESOLVED', handledBy: '食堂管理员', handledAt: now, handleNotes: '已补餐，后续核对配餐数量', archived: true, archivedAt: now, archivedBy: '食堂管理员', createdAt: now },
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initData, null, 2));
    return initData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { loadDB, saveDB, uuidv4 };
