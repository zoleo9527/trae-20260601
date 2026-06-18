const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'src/store/useAppStore.ts');
let content = fs.readFileSync(storePath, 'utf-8');

const oldBatchProcess = `  batchProcessTodos: (todos) => {
    const opName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    const { verifications } = get();

    const complaintUpdates: Map<string, Complaint["status"]> = new Map();
    const verificationUpdates: Set<string> = new Set();

    for (const todo of todos) {
      if (todo.type === "complaint" || todo.type === "visit") {
        const currentStatus = todo.complaintStatus;
        let nextStatus: Complaint["status"] | null = null;

        if (todo.type === "visit") {
          nextStatus = "completed";
        } else if (currentStatus === "pending") {
          nextStatus = "processing";
        } else if (currentStatus === "processing") {
          nextStatus = "to_visit";
        } else if (currentStatus === "to_visit") {
          nextStatus = "completed";
        } else if (currentStatus === "escalated") {
          nextStatus = "to_visit";
        }

        if (nextStatus) {
          complaintUpdates.set(todo.relatedId, nextStatus);
        }
      } else if (todo.type === "verification") {
        const v = verifications.find((ver) => ver.id === todo.relatedId);
        if (v && v.status === "abnormal") {
          verificationUpdates.add(todo.relatedId);
        }
      }
    }

    set((state) => ({
      complaints: state.complaints.map((c) =>
        complaintUpdates.has(c.id) ? { ...c, status: complaintUpdates.get(c.id)! } : c
      ),
      verifications: state.verifications.map((v) =>
        verificationUpdates.has(v.id) ? { ...v, status: "normal" as const } : v
      ),
      todoSelectedIds: new Set(),
      activities: [
        {
          id: \`ACT\${Date.now()}\`,
          actor: opName,
          role: get().currentRole,
          action: \`批量处理了\${todos.length}条待办事项\`,
          target: todos.map((t) => t.id).join(","),
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },`;

const newBatchProcess = `  batchProcessTodos: (todos) => {
    const opName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    const { verifications } = get();

    const complaintUpdates: Map<string, Complaint["status"]> = new Map();
    const verificationUpdates: Set<string> = new Set();

    let acceptCount = 0;
    let markVisitCount = 0;
    let completeVisitCount = 0;
    let downgradeVisitCount = 0;
    let handleAbnormalCount = 0;

    const allRelatedIds: string[] = [];

    for (const todo of todos) {
      if (todo.type === "complaint" || todo.type === "visit") {
        const currentStatus = todo.complaintStatus;
        let nextStatus: Complaint["status"] | null = null;

        if (todo.type === "visit") {
          nextStatus = "completed";
          completeVisitCount++;
        } else if (currentStatus === "pending") {
          nextStatus = "processing";
          acceptCount++;
        } else if (currentStatus === "processing") {
          nextStatus = "to_visit";
          markVisitCount++;
        } else if (currentStatus === "to_visit") {
          nextStatus = "completed";
          completeVisitCount++;
        } else if (currentStatus === "escalated") {
          nextStatus = "to_visit";
          downgradeVisitCount++;
        }

        if (nextStatus) {
          complaintUpdates.set(todo.relatedId, nextStatus);
          allRelatedIds.push(todo.relatedId);
        }
      } else if (todo.type === "verification") {
        const v = verifications.find((ver) => ver.id === todo.relatedId);
        if (v && v.status === "abnormal") {
          verificationUpdates.add(todo.relatedId);
          handleAbnormalCount++;
          allRelatedIds.push(todo.relatedId);
        }
      }
    }

    const actionParts: string[] = [];
    if (acceptCount > 0) actionParts.push(\`受理\${acceptCount}条客诉\`);
    if (markVisitCount > 0) actionParts.push(\`标记待回访\${markVisitCount}条客诉\`);
    if (completeVisitCount > 0) actionParts.push(\`完成回访\${completeVisitCount}条客诉\`);
    if (downgradeVisitCount > 0) actionParts.push(\`降级回访\${downgradeVisitCount}条客诉\`);
    if (handleAbnormalCount > 0) actionParts.push(\`处理\${handleAbnormalCount}条异常核销\`);

    let actionText = "";
    if (actionParts.length === 1) {
      actionText = \`批量\${actionParts[0]}\`;
    } else if (actionParts.length > 1) {
      actionText = \`批量处理：\${actionParts.join("；")}\`;
    }

    let targetText = "";
    const totalCount = allRelatedIds.length;
    if (totalCount <= 3) {
      targetText = allRelatedIds.join(",");
    } else {
      targetText = \`\${allRelatedIds.slice(0, 3).join(",")}等\${totalCount}个\`;
    }

    set((state) => ({
      complaints: state.complaints.map((c) =>
        complaintUpdates.has(c.id) ? { ...c, status: complaintUpdates.get(c.id)! } : c
      ),
      verifications: state.verifications.map((v) =>
        verificationUpdates.has(v.id) ? { ...v, status: "normal" as const } : v
      ),
      todoSelectedIds: new Set(),
      activities: [
        {
          id: \`ACT\${Date.now()}\`,
          actor: opName,
          role: get().currentRole,
          action: actionText,
          target: targetText,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },`;

if (content.includes(oldBatchProcess)) {
  content = content.replace(oldBatchProcess, newBatchProcess);
  fs.writeFileSync(storePath, content, 'utf-8');
  console.log('useAppStore.ts 修改成功');
} else {
  console.log('未找到匹配的 batchProcessTodos 函数');
}
