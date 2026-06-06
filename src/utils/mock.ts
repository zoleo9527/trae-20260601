import type { LiveReview, AbnormalOrder, OperationLog, User } from "@/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomDate(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date.toISOString();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const anchors = ["李佳琪", "薇娅", "罗永浩", "董宇辉", "小杨哥", "陈洁"];
const assistants = ["小王", "小李", "小张", "小陈", "小刘"];
const controllers = ["场控A", "场控B", "场控C"];
const aftersales = ["张组长", "李组长", "王组长"];

const liveTitles = [
  "618年中大促专场",
  "新品首发直播",
  "品牌特卖会",
  "周年庆狂欢夜",
  "双11预售场",
  "超级品牌日",
  "粉丝回馈专场",
  "美妆节专场",
];

const products = [
  { name: "兰蔻小黑瓶精华 50ml", image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=100&h=100&fit=crop" },
  { name: "SK-II神仙水 230ml", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop" },
  { name: "雅诗兰黛小棕瓶 50ml", image: "https://images.unsplash.com/photo-1598440947619-2c112a71d327?w=100&h=100&fit=crop" },
  { name: "海蓝之谜面霜 60ml", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&h=100&fit=crop" },
  { name: "iPhone 15 Pro Max 256G", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&h=100&fit=crop" },
  { name: "戴森吹风机 HD08", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&h=100&fit=crop" },
];

const abnormalTypes = [
  "未按约定发货",
  "商品质量问题",
  "描述与实物不符",
  "价格错误",
  "库存不足",
  "退款纠纷",
];

const abnormalDescs = [
  "买家反馈商品未在承诺的48小时内发货",
  "收到商品后发现外包装破损，内部有划痕",
  "直播中宣传为真皮材质，实际收到为人造革",
  "直播价格设置错误，比正常售价低200元",
  "超卖导致部分订单无法发货",
  "买家申请退款后商家未及时处理",
];

const buyerNames = ["快乐购物家", "时尚达人88", "品质生活家", "精明消费者", "爱购物的小明", "精致女孩"];

function createMockOperationLog(
  targetId: string,
  targetType: "review" | "order",
  operator: string,
  operatorRole: "assistant" | "controller" | "aftersales",
  operationType: "create" | "submit" | "reject" | "confirm" | "supplement" | "transfer" | "process" | "close",
  operationDesc: string,
  daysAgo: number = 0
): OperationLog {
  return {
    id: generateId(),
    targetId,
    targetType,
    operator,
    operatorRole,
    operationType,
    operationDesc,
    createdAt: randomDate(daysAgo),
  };
}

function createMockAbnormalOrder(reviewId: string, index: number, daysAgo: number): AbnormalOrder {
  const statuses: AbnormalOrder["status"][] = ["pending", "rejected", "supplement", "confirmed", "processing", "resolved"];
  const status = pickRandom(statuses);
  const product = pickRandom(products);
  const abnormalType = pickRandom(abnormalTypes);
  const abnormalDesc = pickRandom(abnormalDescs);

  const logs: OperationLog[] = [
    createMockOperationLog(
      reviewId,
      "order",
      pickRandom(assistants),
      "assistant",
      "create",
      "标记异常订单",
      daysAgo
    ),
  ];

  if (status !== "pending") {
    logs.push(
      createMockOperationLog(
        reviewId,
        "order",
        pickRandom(controllers),
        "controller",
        status === "rejected" ? "reject" : "confirm",
        status === "rejected" ? "驳回异常订单" : "确认异常订单",
        daysAgo - 1
      )
    );
  }

  if (status === "resolved" || status === "processing") {
    logs.push(
      createMockOperationLog(
        reviewId,
        "order",
        pickRandom(aftersales),
        "aftersales",
        "process",
        status === "resolved" ? "已完成退款处理" : "正在处理退款",
        daysAgo - 2
      )
    );
  }

  return {
    id: generateId(),
    reviewId,
    orderNo: `DD${Date.now()}${String(index).padStart(4, "0")}`,
    productName: product.name,
    productImage: product.image,
    buyerName: pickRandom(buyerNames),
    buyerPhone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`,
    amount: Math.floor(Math.random() * 5000) + 100,
    abnormalType,
    abnormalDesc,
    status,
    rejectReason: status === "rejected" ? "证据不足，请补充现场记录截图" : undefined,
    supplementRequired: status === "supplement",
    supplementNotes: status === "supplement" ? "请补充与买家的沟通记录" : undefined,
    processResult: status === "resolved" ? "已全额退款并补偿优惠券" : undefined,
    operationLogs: logs,
    createdAt: randomDate(daysAgo),
    updatedAt: randomDate(daysAgo - 1),
  };
}

export function createMockReviews(): LiveReview[] {
  const reviews: LiveReview[] = [];
  const statuses: LiveReview["status"][] = ["pending", "rejected", "confirmed", "processing", "closed"];
  const handlers: LiveReview["currentHandler"][] = ["assistant", "controller", "aftersales"];

  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(i / 2);
    const status = pickRandom(statuses);
    const handler = status === "pending" || status === "rejected"
      ? "controller"
      : status === "confirmed"
        ? "aftersales"
        : pickRandom(handlers);

    const orderCount = Math.floor(Math.random() * 3) + 1;
    const abnormalOrders: AbnormalOrder[] = [];
    for (let j = 0; j < orderCount; j++) {
      abnormalOrders.push(createMockAbnormalOrder(`review-${i}`, j, daysAgo));
    }

    const logs: OperationLog[] = [
      createMockOperationLog(
        `review-${i}`,
        "review",
        pickRandom(assistants),
        "assistant",
        "create",
        "创建场次复盘单",
        daysAgo
      ),
      createMockOperationLog(
        `review-${i}`,
        "review",
        pickRandom(assistants),
        "assistant",
        "submit",
        "提交审核",
        daysAgo - 0.5
      ),
    ];

    if (status === "rejected") {
      logs.push(
        createMockOperationLog(
          `review-${i}`,
          "review",
          pickRandom(controllers),
          "controller",
          "reject",
          "驳回复盘单，需要补录现场记录",
          daysAgo - 1
        )
      );
    }

    if (status === "confirmed" || status === "processing" || status === "closed") {
      logs.push(
        createMockOperationLog(
          `review-${i}`,
          "review",
          pickRandom(controllers),
          "controller",
          "confirm",
          "确认异常，流转至售后",
          daysAgo - 1
        )
      );
    }

    if (status === "processing" || status === "closed") {
      logs.push(
        createMockOperationLog(
          `review-${i}`,
          "review",
          pickRandom(aftersales),
          "aftersales",
          "transfer",
          "售后组长已接收",
          daysAgo - 1.5
        )
      );
    }

    if (status === "closed") {
      logs.push(
        createMockOperationLog(
          `review-${i}`,
          "review",
          pickRandom(aftersales),
          "aftersales",
          "close",
          "所有异常订单已处理完成，关闭复盘单",
          daysAgo - 2
        )
      );
    }

    reviews.push({
      id: `review-${i}`,
      sessionNo: `ZC${202406}${String(i + 1).padStart(4, "0")}`,
      liveTitle: pickRandom(liveTitles),
      anchorName: pickRandom(anchors),
      assistantName: pickRandom(assistants),
      startTime: randomDate(daysAgo),
      endTime: randomDate(daysAgo),
      duration: Math.floor(Math.random() * 180) + 60,
      gmv: Math.floor(Math.random() * 5000000) + 500000,
      orderCount: Math.floor(Math.random() * 5000) + 500,
      viewerCount: Math.floor(Math.random() * 100000) + 10000,
      status,
      siteRecords: "直播过程中网络有波动，第45分钟到50分钟画面卡顿。部分商品链接跳转异常，已记录在现场笔记本中。",
      oldLedger: "对比上一场同类型直播，GMV增长15%，客单价提升8%。退货率略高，需要关注。",
      chatScreenshots: [],
      abnormalOrders,
      operationLogs: logs,
      createdAt: randomDate(daysAgo),
      updatedAt: randomDate(daysAgo - 0.5),
      currentHandler: handler,
      rejectReason: status === "rejected" ? "现场记录不够详细，请补充沟通截图和具体时间点" : undefined,
      supplementRequired: status === "rejected",
      supplementNotes: status === "rejected" ? "请补充第45分钟网络卡顿期间的观众反馈截图" : undefined,
      isOverdue: daysAgo >= 1 && status !== "closed",
    });
  }

  return reviews;
}

export const mockUsers: User[] = [
  { id: "1", name: "小王", role: "assistant" },
  { id: "2", name: "场控A", role: "controller" },
  { id: "3", name: "张组长", role: "aftersales" },
];
