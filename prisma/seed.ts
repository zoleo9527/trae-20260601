import { PrismaClient } from "@prisma/client";
import { UserRole, HotspotStatus, ActionType } from "../lib/types";

const prisma = new PrismaClient();

async function main() {
  console.log("开始写入种子数据...");

  const inspector = await prisma.user.upsert({
    where: { username: "inspector01" },
    update: {},
    create: {
      username: "inspector01",
      password: "123456",
      name: "张巡检",
      role: UserRole.INSPECTOR,
      phone: "13800000001",
    },
  });

  const inspector2 = await prisma.user.upsert({
    where: { username: "inspector02" },
    update: {},
    create: {
      username: "inspector02",
      password: "123456",
      name: "李巡检",
      role: UserRole.INSPECTOR,
      phone: "13800000002",
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { username: "dispatcher01" },
    update: {},
    create: {
      username: "dispatcher01",
      password: "123456",
      name: "王调度",
      role: UserRole.DISPATCHER,
      phone: "13800000003",
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: "manager01" },
    update: {},
    create: {
      username: "manager01",
      password: "123456",
      name: "赵经理",
      role: UserRole.AREA_MANAGER,
      phone: "13800000004",
    },
  });

  console.log("用户创建完成");

  const hotspot1 = await prisma.hotspotArea.create({
    data: {
      title: "人民广场地铁站B口车辆堆积",
      location: "上海市黄浦区人民广场地铁站B出口",
      latitude: 31.2304,
      longitude: 121.4737,
      description: "早高峰期间车辆严重堆积，约120辆共享单车堵在出口通道，影响行人通行，需要紧急调度转运。",
      bikeCount: 120,
      urgency: 3,
      status: HotspotStatus.PENDING,
      submitterId: inspector.id,
      comments: {
        create: [
          {
            authorId: inspector.id,
            actionType: ActionType.SUBMIT,
            content: "【现场提交】8:15巡检发现，B出口通道被共享单车完全堵死，行人只能侧身通过，已拍3张现场照片。联系不上区域调度，先系统上报。",
          },
          {
            authorId: manager.id,
            actionType: ActionType.COMMENT,
            content: "【区域经理关注】已看到，这个点是早高峰老问题，请调度员王调度优先处理。",
          },
        ],
      },
      attachments: {
        create: [
          {
            filename: "现场照片_人民广场_B口_01.jpg",
            fileType: "image/jpeg",
            fileSize: 2048000,
            placeholderUrl: "/placeholder-img-1",
            uploadedBy: inspector.id,
          },
          {
            filename: "现场照片_人民广场_B口_02.jpg",
            fileType: "image/jpeg",
            fileSize: 1843200,
            placeholderUrl: "/placeholder-img-2",
            uploadedBy: inspector.id,
          },
        ],
      },
    },
    include: { comments: true, attachments: true },
  });

  console.log("热点1创建完成（待派单状态）");

  const hotspot2 = await prisma.hotspotArea.create({
    data: {
      title: "徐家汇商圈1号口车辆不足",
      location: "上海市徐汇区徐家汇地铁站1号出口",
      latitude: 31.1946,
      longitude: 121.4365,
      description: "晚高峰时段站点车辆严重不足，仅剩5辆可用车，周边用户反馈无法租车，需要从周边调度补充。",
      bikeCount: 5,
      urgency: 3,
      status: HotspotStatus.DISPATCHED,
      submitterId: inspector2.id,
      dispatcherId: dispatcher.id,
      submittedAt: new Date(Date.now() - 3600000 * 2),
      dispatchedAt: new Date(Date.now() - 3600000),
      dispatchOrders: {
        create: {
          orderNo: "DD202606100001",
          instructions: "从漕溪北路停车场调运40辆车至徐家汇1号口，19:00前完成。",
          assigneeId: inspector.id,
          comments: {
            create: [
              {
                authorId: dispatcher.id,
                actionType: ActionType.DISPATCH,
                content: "已派单给张巡检，从漕溪北路停车场调运。",
              },
            ],
          },
        },
      },
      comments: {
        create: [
          {
            authorId: inspector2.id,
            actionType: ActionType.SUBMIT,
            content: "【现场提交】17:40发现站点仅剩5辆车，周围排队等车用户约15人，已口头通知调度室。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.COMMENT,
            content: "收到，漕溪北路停车场有富余车辆，正在安排调运。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.DISPATCH,
            content: "【调度派单】派单编号DD202606100001，指派张巡检从漕溪北路调运40辆，19:00前到位。",
          },
          {
            authorId: manager.id,
            actionType: ActionType.COMMENT,
            content: "注意这个点是徐家汇核心商圈，晚高峰需求量大，务必准时到位。",
          },
        ],
      },
      attachments: {
        create: [
          {
            filename: "徐家汇_空桩照片.jpg",
            fileType: "image/jpeg",
            fileSize: 1536000,
            placeholderUrl: "/placeholder-img-3",
            uploadedBy: inspector2.id,
          },
          {
            filename: "调度沟通截图_0610.png",
            fileType: "image/png",
            fileSize: 512000,
            placeholderUrl: "/placeholder-img-4",
            uploadedBy: dispatcher.id,
          },
        ],
      },
    },
    include: { comments: true, dispatchOrders: true, attachments: true },
  });

  console.log("热点2创建完成（已派单状态）");

  const hotspot3 = await prisma.hotspotArea.create({
    data: {
      title: "中山公园龙之梦门口车辆淤积",
      location: "上海市长宁区长宁路1018号龙之梦购物中心门口",
      latitude: 31.2205,
      longitude: 121.4252,
      description: "周末下午商场门口车辆大量淤积，约80辆占用盲道和人行道，需要分流转运。",
      bikeCount: 80,
      urgency: 2,
      status: HotspotStatus.IN_PROGRESS,
      submitterId: inspector.id,
      dispatcherId: dispatcher.id,
      submittedAt: new Date(Date.now() - 3600000 * 4),
      dispatchedAt: new Date(Date.now() - 3600000 * 3),
      dispatchOrders: {
        create: {
          orderNo: "DD202606100002",
          instructions: "将门口淤积车辆分流至周边3个地铁站，预计转运60辆。",
          assigneeId: inspector2.id,
          acceptorId: inspector2.id,
          acceptedAt: new Date(Date.now() - 3600000 * 2.5),
          comments: {
            create: [
              {
                authorId: inspector2.id,
                actionType: ActionType.ACCEPT,
                content: "已接单，正在赶赴现场。",
              },
              {
                authorId: inspector2.id,
                actionType: ActionType.UPDATE,
                content: "已到达现场，正在装车，已转运20辆到中山公园地铁站。",
              },
            ],
          },
        },
      },
      comments: {
        create: [
          {
            authorId: inspector.id,
            actionType: ActionType.SUBMIT,
            content: "【现场提交】14:20发现龙之梦门口车辆严重淤积，已占用人行道和盲道，城管可能来巡查。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.COMMENT,
            content: "收到，正在找空闲的巡检员。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.DISPATCH,
            content: "【调度派单】派单编号DD202606100002，指派李巡检分流转运60辆至周边地铁站。",
          },
          {
            authorId: inspector2.id,
            actionType: ActionType.ACCEPT,
            content: "接单，预计15分钟到现场。",
          },
          {
            authorId: inspector2.id,
            actionType: ActionType.UPDATE,
            content: "现场情况：正门口堆了约80辆，大部分还能正常使用，先转运到2号线和3/4号线中山公园站。",
          },
          {
            authorId: inspector2.id,
            actionType: ActionType.COMMENT,
            content: "已转运20辆到2号线5号口，继续装车中。",
          },
        ],
      },
      attachments: {
        create: [
          {
            filename: "龙之梦门口_淤积全景.jpg",
            fileType: "image/jpeg",
            fileSize: 3072000,
            placeholderUrl: "/placeholder-img-5",
            uploadedBy: inspector.id,
          },
        ],
      },
    },
    include: { comments: true, dispatchOrders: true, attachments: true },
  });

  console.log("热点3创建完成（处理中状态）");

  const hotspot4 = await prisma.hotspotArea.create({
    data: {
      title: "静安寺地铁站2号口车辆积压",
      location: "上海市静安区南京西路1618号静安寺地铁站2号出口",
      latitude: 31.2236,
      longitude: 121.4452,
      description: "早高峰后车辆积压严重，约95辆占用非机动车道，已完成转运处理。",
      bikeCount: 95,
      urgency: 3,
      status: HotspotStatus.COMPLETED,
      submitterId: inspector2.id,
      dispatcherId: dispatcher.id,
      submittedAt: new Date(Date.now() - 3600000 * 8),
      dispatchedAt: new Date(Date.now() - 3600000 * 7.5),
      completedAt: new Date(Date.now() - 3600000 * 5),
      dispatchOrders: {
        create: {
          orderNo: "DD202606100003",
          instructions: "将静安寺2号口积压车辆转运至愚园路停放点和江苏路地铁站，合计转运70辆。",
          assigneeId: inspector.id,
          acceptorId: inspector.id,
          acceptedAt: new Date(Date.now() - 3600000 * 7),
          completedAt: new Date(Date.now() - 3600000 * 5),
          comments: {
            create: [
              {
                authorId: inspector.id,
                actionType: ActionType.ACCEPT,
                content: "已接单。",
              },
              {
                authorId: inspector.id,
                actionType: ActionType.UPDATE,
                content: "正在转运，已完成30辆到愚园路。",
              },
              {
                authorId: inspector.id,
                actionType: ActionType.COMPLETE,
                content: "全部完成，共转运72辆，现场已清理干净。",
              },
            ],
          },
        },
      },
      comments: {
        create: [
          {
            authorId: inspector2.id,
            actionType: ActionType.SUBMIT,
            content: "【现场提交】9:30发现2号口非机动车道几乎全被占，过往电动车只能走机动车道，很危险。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.COMMENT,
            content: "这个点是投诉重灾区，今天必须处理完。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.DISPATCH,
            content: "【调度派单】派单编号DD202606100003，张巡检负责，要求12:00前清理完毕。",
          },
          {
            authorId: inspector.id,
            actionType: ActionType.ACCEPT,
            content: "好的，马上过去。",
          },
          {
            authorId: inspector.id,
            actionType: ActionType.UPDATE,
            content: "已到现场，先挪出一条通道让电动车过。准备分三批运：愚园路30辆、江苏路站25辆、镇宁路15辆。",
          },
          {
            authorId: inspector.id,
            actionType: ActionType.UPDATE,
            content: "第二批已出发，还剩最后20辆。",
          },
          {
            authorId: inspector.id,
            actionType: ActionType.COMPLETE,
            content: "【处理完成】11:42全部完成，共转运72辆。现场拍了前后对比照片，见附件。",
          },
          {
            authorId: dispatcher.id,
            actionType: ActionType.COMMENT,
            content: "做得好，前后对比很清楚，已标记完成。",
          },
          {
            authorId: manager.id,
            actionType: ActionType.COMMENT,
            content: "这个点后续需要和地铁方沟通是否能增设围栏引导停放。",
          },
        ],
      },
      attachments: {
        create: [
          {
            filename: "静安寺_处理前.jpg",
            fileType: "image/jpeg",
            fileSize: 2560000,
            placeholderUrl: "/placeholder-img-6",
            uploadedBy: inspector2.id,
          },
          {
            filename: "静安寺_处理后_对比.jpg",
            fileType: "image/jpeg",
            fileSize: 2304000,
            placeholderUrl: "/placeholder-img-7",
            uploadedBy: inspector.id,
          },
          {
            filename: "转运路线记录.pdf",
            fileType: "application/pdf",
            fileSize: 102400,
            placeholderUrl: "/placeholder-pdf-1",
            uploadedBy: inspector.id,
          },
        ],
      },
    },
    include: { comments: true, dispatchOrders: true, attachments: true },
  });

  console.log("热点4创建完成（已完成状态，含完整历史备注链）");

  const hotspot5 = await prisma.hotspotArea.create({
    data: {
      title: "陆家嘴环路天桥下车辆堆积",
      location: "上海市浦东新区陆家嘴环路人行天桥下",
      latitude: 31.2397,
      longitude: 121.4998,
      description: "午休时段白领集中还车，天桥下通道被堵，需要紧急处理。",
      bikeCount: 65,
      urgency: 2,
      status: HotspotStatus.PENDING,
      submitterId: inspector.id,
      comments: {
        create: [
          {
            authorId: inspector.id,
            actionType: ActionType.SUBMIT,
            content: "【现场提交】12:30发现，天桥下约65辆车堵了一半通道，已电话通知调度室。",
          },
        ],
      },
    },
  });

  console.log("热点5创建完成（待派单，简单样例）");

  console.log("所有种子数据写入完成！");
  console.log("\n=== 演示账号 ===");
  console.log("巡检员账号: inspector01 / 123456  (张巡检)");
  console.log("巡检员账号: inspector02 / 123456  (李巡检)");
  console.log("调度员账号: dispatcher01 / 123456 (王调度)");
  console.log("区域经理账号: manager01 / 123456  (赵经理)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
