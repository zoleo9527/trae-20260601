import type {
    FollowUpRecord,
    ParentFeedback,
    Review,
    ReviewTemplate,
    Student,
    TodoItem,
    User,
} from "~/types";

const placeholderImages = [
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1579762715118-a6f1e4b96400?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1549289524-06cf898b2d3e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1541961017774-22349e4ece7e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
];

export const mockUsers: User[] = [
  { id: "t1", name: "李老师", role: "teacher", avatar: "👩‍🎨" },
  { id: "t2", name: "王老师", role: "teacher", avatar: "👨‍🎨" },
  { id: "c1", name: "张顾问", role: "consultant", avatar: "👩‍💼" },
  { id: "d1", name: "赵主管", role: "director", avatar: "👨‍💼" },
  { id: "p1", name: "小明妈妈", role: "parent" },
  { id: "p2", name: "小红爸爸", role: "parent" },
  { id: "p3", name: "小华妈妈", role: "parent" },
  { id: "p4", name: "小刚爸爸", role: "parent" },
];

export const mockStudents: Student[] = [
  {
    id: "s1",
    name: "陈小明",
    age: 8,
    parentId: "p1",
    parentName: "小明妈妈",
    parentPhone: "138****1234",
    classId: "cls1",
    className: "少儿创意画A班",
  },
  {
    id: "s2",
    name: "林小红",
    age: 7,
    parentId: "p2",
    parentName: "小红爸爸",
    parentPhone: "139****5678",
    classId: "cls1",
    className: "少儿创意画A班",
  },
  {
    id: "s3",
    name: "王小华",
    age: 9,
    parentId: "p3",
    parentName: "小华妈妈",
    parentPhone: "137****9012",
    classId: "cls2",
    className: "水彩进阶班",
  },
  {
    id: "s4",
    name: "赵小刚",
    age: 10,
    parentId: "p4",
    parentName: "小刚爸爸",
    parentPhone: "136****3456",
    classId: "cls2",
    className: "水彩进阶班",
  },
];

export const mockTemplates: ReviewTemplate[] = [
  {
    id: "template1",
    name: "创意画标准模板",
    courseType: "creative_painting",
    sections: [
      { id: "sec1", title: "课堂观察", placeholder: "记录孩子本节课的表现、专注度、参与度等", required: true },
      { id: "sec2", title: "作品亮点", placeholder: "列举作品中最出色的地方", required: true },
      { id: "sec3", title: "待改进之处", placeholder: "需要加强和改进的地方", required: true },
      { id: "sec4", title: "下一步练习建议", placeholder: "给孩子课后练习建议", required: true },
    ],
  },
  {
    id: "template2",
    name: "水彩画专业模板",
    courseType: "watercolor",
    sections: [
      { id: "sec1", title: "色彩运用", placeholder: "点评色彩搭配和运用", required: true },
      { id: "sec2", title: "技法表现", placeholder: "水彩技法的掌握情况", required: true },
      { id: "sec3", title: "创意表达", placeholder: "作品的创意和表现力", required: true },
      { id: "sec4", title: "练习建议", placeholder: "针对性的练习建议", required: true },
    ],
  },
];

export const mockReviews: Review[] = [
  {
    id: "r1",
    studentId: "s1",
    studentName: "陈小明",
    courseId: "c1",
    courseName: "少儿创意画A班",
    teacherId: "t1",
    teacherName: "李老师",
    templateId: "template1",
    templateName: "创意画标准模板",
    classDate: "2026-06-05",
    classTime: "14:00-15:30",
    artworkImages: [
      { id: "img1", url: placeholderImages[0], isPlaceholder: false },
      { id: "img2", url: placeholderImages[1], isPlaceholder: false },
    ],
    highlights: "小明今天的色彩搭配非常棒！大胆使用了对比色，画面很有冲击力。特别是太阳的表现很有创意，用了渐变的方式表现光线，层次感很强。",
    improvements: "构图还可以更饱满一些，主体物可以再大一点，让画面更有张力。涂色的时候边缘还可以更细致一些。",
    observation: "今天上课非常专注，全程紧跟老师的节奏，积极回答问题。和同学互动也很友好，主动帮助旁边的小朋友拿画笔。",
    nextPractice: "1. 在家练习画大色块的涂色练习，注意边缘整齐\n2. 尝试用不同的颜色搭配画太阳\n3. 观察生活中的色彩变化",
    answers: [
      { sectionId: "sec1", content: "今天上课非常专注，全程紧跟老师的节奏，积极回答问题。" },
      { sectionId: "sec2", content: "色彩搭配大胆，太阳的渐变色表现很好。" },
      { sectionId: "sec3", content: "构图主体物偏小，涂色边缘不够整齐。" },
      { sectionId: "sec4", content: "练习大色块涂色，注意边缘。" },
    ],
    feedbackStatus: "parent_unread",
    createdAt: "2026-06-05T16:00:00",
    updatedAt: "2026-06-05T16:00:00",
  },
  {
    id: "r2",
    studentId: "s2",
    studentName: "林小红",
    courseId: "c1",
    courseName: "少儿创意画A班",
    teacherId: "t1",
    teacherName: "李老师",
    templateId: "template1",
    templateName: "创意画标准模板",
    classDate: "2026-06-05",
    classTime: "14:00-15:30",
    artworkImages: [
      { id: "img3", url: placeholderImages[2], isPlaceholder: false },
    ],
    highlights: "小红的线条越来越流畅了，今天画的小动物造型很生动。色彩的层次感很强，特别有自己的想法。",
    improvements: "速度可以稍微慢一点，不要太着急，这样细节可以表现得更好。",
    observation: "上课很认真，但是中间有一点小情绪，因为画错了一笔就不太开心。后来在老师的鼓励下又重新调整好了。",
    nextPractice: "1. 练习画简单的小动物造型\n2. 涂色的时候慢慢来，注意细节\n3. 遇到困难时深呼吸，不要着急",
    answers: [
      { sectionId: "sec1", content: "上课认真，但中间有小情绪，需要老师鼓励。" },
      { sectionId: "sec2", content: "线条流畅，造型生动。" },
      { sectionId: "sec3", content: "速度偏快，细节不够。" },
      { sectionId: "sec4", content: "放慢速度，注意细节。" },
    ],
    feedbackStatus: "parent_replied",
    feedbackType: "class_change",
    createdAt: "2026-06-05T16:30:00",
    updatedAt: "2026-06-06T09:00:00",
  },
  {
    id: "r3",
    studentId: "s3",
    studentName: "王小华",
    courseId: "c2",
    courseName: "水彩进阶班",
    teacherId: "t2",
    teacherName: "王老师",
    templateId: "template2",
    templateName: "水彩画专业模板",
    classDate: "2026-06-04",
    classTime: "10:00-11:30",
    artworkImages: [],
    highlights: "小华对水彩的掌握进步很大，水分控制得比之前好很多。",
    improvements: "今天的作品没有完成，带回家继续完成后补交。",
    observation: "今天上课状态不太好，有点分心，所以作品没有按时完成。",
    nextPractice: "1. 完成今天未完成的作品\n2. 在家练习水彩晕染技法\n3. 复习本节课的知识点",
    answers: [
      { sectionId: "sec1", content: "色彩搭配还可以，但是不够均匀。" },
      { sectionId: "sec2", content: "水分控制有进步。" },
      { sectionId: "sec3", content: "作品未完成，需要补交。" },
      { sectionId: "sec4", content: "完成作品，练习晕染。" },
    ],
    feedbackStatus: "pending_makeup",
    feedbackType: "makeup_required",
    createdAt: "2026-06-04T12:00:00",
    updatedAt: "2026-06-04T12:00:00",
  },
  {
    id: "r4",
    studentId: "s4",
    studentName: "赵小刚",
    courseId: "c2",
    courseName: "水彩进阶班",
    teacherId: "t2",
    teacherName: "王老师",
    templateId: "template2",
    templateName: "水彩画专业模板",
    classDate: "2026-06-04",
    classTime: "10:00-11:30",
    artworkImages: [
      { id: "img4", url: placeholderImages[4], isPlaceholder: false },
      { id: "img5", url: placeholderImages[5], isPlaceholder: false },
    ],
    highlights: "小刚的进步非常明显！今天的风景画构图很完整，色彩过渡自然，有大师的风范了。",
    improvements: "远景的处理还可以再虚一些，这样空间感会更强。",
    observation: "上课非常投入，主动尝试了老师讲的新技法，效果很好。",
    nextPractice: "1. 练习风景画的空间感表现\n2. 尝试不同的远景处理方式\n3. 继续保持对绘画的热情",
    answers: [
      { sectionId: "sec1", content: "色彩搭配和谐，色调统一。" },
      { sectionId: "sec2", content: "技法掌握很好，主动尝试新方法。" },
      { sectionId: "sec3", content: "远景可以更虚一些。" },
      { sectionId: "sec4", content: "练习空间感表现。" },
    ],
    feedbackStatus: "parent_read",
    createdAt: "2026-06-04T12:30:00",
    updatedAt: "2026-06-05T08:00:00",
  },
  {
    id: "r5",
    studentId: "s1",
    studentName: "陈小明",
    courseId: "c1",
    courseName: "少儿创意画A班",
    teacherId: "t1",
    teacherName: "李老师",
    templateId: "template1",
    templateName: "创意画标准模板",
    classDate: "2026-05-29",
    classTime: "14:00-15:30",
    artworkImages: [
      { id: "img6", url: placeholderImages[3], isPlaceholder: false },
    ],
    highlights: "小明这次的作品主题很明确，画的是一家人去公园，很有生活气息。",
    improvements: "人物的比例还需要注意一下，头太大了。",
    observation: "今天上课很开心，一直在跟老师分享周末去公园的经历。",
    nextPractice: "1. 观察人物的比例\n2. 画不同姿势的人物\n3. 继续记录生活中的美好瞬间",
    answers: [
      { sectionId: "sec1", content: "上课开心，积极分享生活经历。" },
      { sectionId: "sec2", content: "主题明确，有生活气息。" },
      { sectionId: "sec3", content: "人物比例需要注意。" },
      { sectionId: "sec4", content: "练习人物比例。" },
    ],
    feedbackStatus: "resolved",
    feedbackType: "praise",
    createdAt: "2026-05-29T16:00:00",
    updatedAt: "2026-05-30T10:00:00",
  },
  {
    id: "r6",
    studentId: "s4",
    studentName: "赵小刚",
    courseId: "c2",
    courseName: "水彩进阶班",
    teacherId: "t2",
    teacherName: "王老师",
    templateId: "template2",
    templateName: "水彩画专业模板",
    classDate: "2026-06-05",
    classTime: "10:00-11:30",
    artworkImages: [
      { id: "img7", url: placeholderImages[0], isPlaceholder: false },
    ],
    highlights: "小刚今天尝试了湿画法，效果还不错，色彩过渡比较自然。",
    improvements: "对色彩的理解还需要加强，调色的时候有点混乱。",
    observation: "今天上课比较沉默，没有像往常一样主动提问，好像有些心事。",
    nextPractice: "1. 练习色彩基础知识\n2. 尝试不同的调色练习\n3. 保持和老师的沟通",
    answers: [
      { sectionId: "sec1", content: "湿画法尝试有进步。" },
      { sectionId: "sec2", content: "色彩过渡自然。" },
      { sectionId: "sec3", content: "调色需要加强。" },
      { sectionId: "sec4", content: "练习色彩基础知识。" },
    ],
    feedbackStatus: "parent_replied",
    feedbackType: "teacher_change",
    createdAt: "2026-06-05T12:00:00",
    updatedAt: "2026-06-06T08:30:00",
  },
];

export const mockFeedbacks: ParentFeedback[] = [
  {
    id: "f1",
    reviewId: "r2",
    parentId: "p2",
    parentName: "小红爸爸",
    content: "老师您好，我们家小红最近上课状态不太好，我们想换一个班级试一下，不知道有没有合适的班级推荐？另外想了解一下换班的流程。",
    type: "class_change",
    createdAt: "2026-06-06T09:00:00",
    hasTodo: true,
    todoId: "todo1",
  },
  {
    id: "f2",
    reviewId: "r5",
    parentId: "p1",
    parentName: "小明妈妈",
    content: "谢谢老师的点评！小明回家很喜欢上您的课，每次回来都很开心，我们会继续支持的！",
    type: "praise",
    createdAt: "2026-05-30T10:00:00",
    hasTodo: false,
  },
  {
    id: "f3",
    reviewId: "r6",
    parentId: "p4",
    parentName: "小刚爸爸",
    content: "老师您好，我们家小刚最近回家说不太适应现在的上课节奏，我们想考虑换一位老师试试看。小刚之前很喜欢画画的，现在积极性有点下降，我们担心会影响他的兴趣。想咨询一下有没有其他老师的班可以安排试听？",
    type: "teacher_change",
    createdAt: "2026-06-06T08:30:00",
    hasTodo: false,
  },
];

export const mockFollowUps: FollowUpRecord[] = [
  {
    id: "fu1",
    reviewId: "r2",
    operatorId: "c1",
    operatorName: "张顾问",
    operatorRole: "consultant",
    content: "已联系小红爸爸，了解到家长希望换到周六上午的班，正在协调中。",
    createdAt: "2026-06-06T10:00:00",
  },
  {
    id: "fu2",
    reviewId: "r2",
    operatorId: "c1",
    operatorName: "张顾问",
    operatorRole: "consultant",
    content: "已确认周六上午有名额，待家长确认时间。",
    createdAt: "2026-06-06T11:30:00",
  },
  {
    id: "fu3",
    reviewId: "r3",
    operatorId: "c1",
    operatorName: "张顾问",
    operatorRole: "consultant",
    content: "已提醒小华妈妈补交作品，家长回复说明天带过来。",
    createdAt: "2026-06-05T09:00:00",
  },
];

export const mockTodos: TodoItem[] = [
  {
    id: "todo1",
    title: "林小红家长要求换班",
    description: "家长希望将林小红从少儿创意画A班换到其他班级，需要协调班级名额和时间。",
    type: "class_change",
    reviewId: "r2",
    studentName: "林小红",
    parentName: "小红爸爸",
    feedbackId: "f1",
    status: "in_progress",
    assigneeId: "c1",
    assigneeName: "张顾问",
    createdAt: "2026-06-06T09:30:00",
    dueDate: "2026-06-08",
  },
  {
    id: "todo2",
    title: "王小华作品需补交",
    description: "王小华本节课作品未完成，需要补交作品。",
    type: "makeup",
    reviewId: "r3",
    studentName: "王小华",
    parentName: "小华妈妈",
    feedbackId: "",
    status: "pending",
    assigneeId: "c1",
    assigneeName: "张顾问",
    createdAt: "2026-06-04T13:00:00",
    dueDate: "2026-06-07",
  },
];

export function getStatusLabel(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    parent_unread: { label: "家长未读", color: "bg-gray-100 text-gray-700" },
    parent_read: { label: "家长已读", color: "bg-blue-100 text-blue-700" },
    parent_replied: { label: "家长已回复", color: "bg-purple-100 text-purple-700" },
    consultant_following: { label: "顾问跟进中", color: "bg-orange-100 text-orange-700" },
    resolved: { label: "已处理", color: "bg-green-100 text-green-700" },
    pending_makeup: { label: "待补交作品", color: "bg-red-100 text-red-700" },
  };
  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
}

export function getFeedbackTypeLabel(type: string): { label: string; color: string } {
  const typeMap: Record<string, { label: string; color: string }> = {
    general: { label: "普通反馈", color: "bg-gray-100 text-gray-700" },
    praise: { label: "表扬", color: "bg-green-100 text-green-700" },
    question: { label: "疑问", color: "bg-blue-100 text-blue-700" },
    suggestion: { label: "建议", color: "bg-yellow-100 text-yellow-700" },
    complaint: { label: "投诉", color: "bg-red-100 text-red-700" },
    class_change: { label: "要求换班", color: "bg-purple-100 text-purple-700" },
    teacher_change: { label: "要求换老师", color: "bg-indigo-100 text-indigo-700" },
    suspension: { label: "要求停课", color: "bg-red-100 text-red-700" },
    makeup_required: { label: "需补交作品", color: "bg-orange-100 text-orange-700" },
  };
  return typeMap[type] || { label: type, color: "bg-gray-100 text-gray-700" };
}

export function getTodoStatusLabel(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "待处理", color: "bg-gray-100 text-gray-700" },
    in_progress: { label: "处理中", color: "bg-blue-100 text-blue-700" },
    completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  };
  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
}

export function getTodoTypeLabel(type: string): { label: string; icon: string } {
  const typeMap: Record<string, { label: string; icon: string }> = {
    class_change: { label: "换班", icon: "🔄" },
    teacher_change: { label: "换老师", icon: "👩‍🏫" },
    suspension: { label: "停课", icon: "⏸️" },
    complaint: { label: "投诉", icon: "⚠️" },
    makeup: { label: "补交", icon: "📝" },
    other: { label: "其他", icon: "📋" },
  };
  return typeMap[type] || { label: type, icon: "📋" };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
