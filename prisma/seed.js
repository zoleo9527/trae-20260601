const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = [
    { name: '一年级1班', grade: '一年级', teacher: '张老师', students: 45 },
    { name: '一年级2班', grade: '一年级', teacher: '李老师', students: 43 },
    { name: '二年级1班', grade: '二年级', teacher: '王老师', students: 42 },
    { name: '三年级1班', grade: '三年级', teacher: '赵老师', students: 40 },
  ];

  const createdClasses = [];
  for (const c of classes) {
    const cls = await prisma.class.create({ data: c });
    createdClasses.push(cls);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.mealRecord.createMany({
    data: [
      {
        classId: createdClasses[0].id,
        mealDate: today,
        mealType: '午餐',
        quantity: 45,
        receivedBy: '张老师',
        status: 'DELIVERED',
        notes: '全员就餐'
      },
      {
        classId: createdClasses[1].id,
        mealDate: today,
        mealType: '午餐',
        quantity: 42,
        receivedBy: '李老师',
        status: 'DELIVERED',
        notes: '1人请假'
      },
      {
        classId: createdClasses[2].id,
        mealDate: yesterday,
        mealType: '午餐',
        quantity: 40,
        receivedBy: '王老师',
        status: 'DELIVERED',
        notes: '2人请假未取餐'
      },
    ]
  });

  const meal2 = await prisma.mealRecord.findFirst({
    where: { classId: createdClasses[1].id }
  });

  await prisma.mealFeedback.createMany({
    data: [
      {
        classId: createdClasses[1].id,
        mealRecordId: meal2.id,
        mealDate: today,
        mealType: '午餐',
        feedbackType: 'MISSING',
        description: '本班实际43人，只收到42份，李明同学没有领到午餐',
        reportedBy: '李老师',
        status: 'PENDING'
      },
      {
        classId: createdClasses[2].id,
        mealDate: yesterday,
        mealType: '午餐',
        feedbackType: 'QUALITY',
        description: '今天的米饭有点硬，部分学生反映吃不惯',
        reportedBy: '王老师',
        status: 'RESOLVED',
        handledBy: '食堂管理员',
        handledAt: new Date(),
        handleNotes: '已反馈给后厨，明天改善米饭软硬程度'
      }
    ]
  });

  console.log('种子数据创建完成！');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
