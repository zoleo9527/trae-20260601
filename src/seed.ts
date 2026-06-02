import db, { initDatabase } from './database';

function seedData() {
  console.log('开始插入种子数据...');

  const insertRoute = db.prepare(`
    INSERT INTO routes (name, description, direction, estimated_duration)
    VALUES (?, ?, ?, ?)
  `);

  const insertStop = db.prepare(`
    INSERT INTO stops (route_id, name, address, sequence, estimated_arrival_time, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (plate_number, model, capacity, status, last_maintenance_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertDriver = db.prepare(`
    INSERT INTO drivers (name, phone, employee_id, license_number, status, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (name, student_id, grade, class, parent_name, parent_phone, default_route_id, default_stop_id, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (route_id, vehicle_id, driver_id, schedule_date, shift_type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCheckIn = db.prepare(`
    INSERT INTO check_ins (schedule_id, stop_id, driver_id, actual_arrival_time, estimated_arrival_time, status, delay_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRideRecord = db.prepare(`
    INSERT INTO ride_records (schedule_id, student_id, stop_id, check_in_id, status, board_time, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLateEvent = db.prepare(`
    INSERT INTO late_events (schedule_id, stop_id, check_in_id, delay_minutes, detected_time, reason, status, reported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (student_id, schedule_id, complaint_type, description, parent_name, parent_phone, complaint_time, status, handler_id, handler_notes, review_result, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    console.log('1. 创建线路...');
    const route1Id = insertRoute.run(
      '1号线 - 城东线',
      '从城东小区到实验学校',
      'morning',
      45
    ).lastInsertRowid as number;

    const route2Id = insertRoute.run(
      '2号线 - 城西线',
      '从城西花园到实验学校',
      'morning',
      40
    ).lastInsertRowid as number;

    const route3Id = insertRoute.run(
      '1号线 - 城东线(下午)',
      '从实验学校到城东小区',
      'afternoon',
      45
    ).lastInsertRowid as number;

    console.log('2. 创建站点...');
    const stops1 = [
      { name: '城东小区北门', address: '城东大道123号', sequence: 1, time: '06:30:00' },
      { name: '阳光花园站', address: '阳光路88号', sequence: 2, time: '06:38:00' },
      { name: '人民广场站', address: '人民大道1号', sequence: 3, time: '06:48:00' },
      { name: '实验学校站', address: '学府路99号', sequence: 4, time: '07:15:00' }
    ];

    const stopIds1: number[] = [];
    for (const stop of stops1) {
      const id = insertStop.run(
        route1Id,
        stop.name,
        stop.address,
        stop.sequence,
        stop.time,
        30.123456,
        120.654321
      ).lastInsertRowid as number;
      stopIds1.push(id);
    }

    const stops2 = [
      { name: '城西花园南门', address: '城西大道456号', sequence: 1, time: '06:20:00' },
      { name: '翠竹苑站', address: '翠竹路66号', sequence: 2, time: '06:30:00' },
      { name: '体育中心站', address: '体育路1号', sequence: 3, time: '06:42:00' },
      { name: '实验学校站', address: '学府路99号', sequence: 4, time: '07:00:00' }
    ];

    const stopIds2: number[] = [];
    for (const stop of stops2) {
      const id = insertStop.run(
        route2Id,
        stop.name,
        stop.address,
        stop.sequence,
        stop.time,
        30.223456,
        120.554321
      ).lastInsertRowid as number;
      stopIds2.push(id);
    }

    console.log('3. 创建车辆...');
    const vehicle1Id = insertVehicle.run(
      '京A12345',
      '宇通客车 ZK6107',
      45,
      'active',
      '2026-05-15'
    ).lastInsertRowid as number;

    const vehicle2Id = insertVehicle.run(
      '京A67890',
      '金龙客车 XMQ6112',
      48,
      'active',
      '2026-05-20'
    ).lastInsertRowid as number;

    const vehicle3Id = insertVehicle.run(
      '京A11111',
      '宇通客车 ZK6122',
      50,
      'maintenance',
      '2026-04-10'
    ).lastInsertRowid as number;

    console.log('4. 创建司机...');
    const driver1Id = insertDriver.run(
      '张建国',
      '13800138001',
      'DRV001',
      'A12023001234',
      'active',
      null
    ).lastInsertRowid as number;

    const driver2Id = insertDriver.run(
      '李明华',
      '13800138002',
      'DRV002',
      'A12023005678',
      'active',
      null
    ).lastInsertRowid as number;

    const driver3Id = insertDriver.run(
      '王大勇',
      '13800138003',
      'DRV003',
      'A12022009012',
      'on_leave',
      null
    ).lastInsertRowid as number;

    console.log('5. 创建学生...');
    const students = [
      { name: '小明', studentId: 'STU001', grade: '三年级', class: '2班', parentName: '小明爸爸', parentPhone: '13900139001' },
      { name: '小红', studentId: 'STU002', grade: '四年级', class: '1班', parentName: '小红妈妈', parentPhone: '13900139002' },
      { name: '小刚', studentId: 'STU003', grade: '三年级', class: '3班', parentName: '小刚爸爸', parentPhone: '13900139003' },
      { name: '小美', studentId: 'STU004', grade: '五年级', class: '1班', parentName: '小美妈妈', parentPhone: '13900139004' },
      { name: '小强', studentId: 'STU005', grade: '二年级', class: '4班', parentName: '小强爸爸', parentPhone: '13900139005' },
      { name: '小丽', studentId: 'STU006', grade: '四年级', class: '2班', parentName: '小丽妈妈', parentPhone: '13900139006' },
      { name: '小华', studentId: 'STU007', grade: '三年级', class: '1班', parentName: '小华爸爸', parentPhone: '13900139007' },
      { name: '小伟', studentId: 'STU008', grade: '五年级', class: '3班', parentName: '小伟妈妈', parentPhone: '13900139008' }
    ];

    const studentIds: number[] = [];
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const routeId = i < 4 ? route1Id : route2Id;
      const stopIndex = i < 4 ? i % 2 : (i - 4) % 2;
      const stopId = i < 4 ? stopIds1[stopIndex] : stopIds2[stopIndex];

      const id = insertStudent.run(
        s.name,
        s.studentId,
        s.grade,
        s.class,
        s.parentName,
        s.parentPhone,
        routeId,
        stopId,
        null
      ).lastInsertRowid as number;
      studentIds.push(id);
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log('6. 创建排班...');
    const schedule1Id = insertSchedule.run(
      route1Id,
      vehicle1Id,
      driver1Id,
      dateStr,
      'morning',
      'in_progress',
      '正常排班'
    ).lastInsertRowid as number;

    const schedule2Id = insertSchedule.run(
      route2Id,
      vehicle2Id,
      driver2Id,
      dateStr,
      'morning',
      'completed',
      '雨天，预计可能晚点'
    ).lastInsertRowid as number;

    const schedule3Id = insertSchedule.run(
      route1Id,
      vehicle1Id,
      driver1Id,
      yesterdayStr,
      'morning',
      'completed',
      '正常排班'
    ).lastInsertRowid as number;

    console.log('7. 场景1: 雨天晚点（2号线）...');
    const checkIns2 = [
      { stopId: stopIds2[0], actualTime: `${dateStr}T06:35:00`, estTime: `${dateStr}T06:20:00`, status: 'late', delay: 15, notes: '雨天路滑，起步慢' },
      { stopId: stopIds2[1], actualTime: `${dateStr}T06:50:00`, estTime: `${dateStr}T06:30:00`, status: 'late', delay: 20, notes: '道路拥堵，行驶缓慢' },
      { stopId: stopIds2[2], actualTime: `${dateStr}T07:05:00`, estTime: `${dateStr}T06:42:00`, status: 'late', delay: 23, notes: '能见度低，谨慎驾驶' },
      { stopId: stopIds2[3], actualTime: `${dateStr}T07:28:00`, estTime: `${dateStr}T07:00:00`, status: 'late', delay: 28, notes: '最终晚点28分钟' }
    ];

    const checkInIds2: number[] = [];
    for (const ci of checkIns2) {
      const id = insertCheckIn.run(
        schedule2Id,
        ci.stopId,
        driver2Id,
        ci.actualTime,
        ci.estTime,
        ci.status,
        ci.delay,
        ci.notes
      ).lastInsertRowid as number;
      checkInIds2.push(id);

      insertLateEvent.run(
        schedule2Id,
        ci.stopId,
        id,
        ci.delay,
        ci.actualTime,
        ci.notes,
        'confirmed',
        'system'
      );
    }

    for (let i = 4; i < 8; i++) {
      const stopIdx = i - 4;
      insertRideRecord.run(
        schedule2Id,
        studentIds[i],
        stopIds2[stopIdx % 2],
        checkInIds2[stopIdx % 2],
        'boarded',
        checkIns2[stopIdx % 2].actualTime,
        '雨天正常乘车'
      );
    }

    console.log('8. 场景2: 司机漏签到（1号线，昨天的排班，第2站漏签）...');
    const checkIns3 = [
      { stopId: stopIds1[0], actualTime: `${yesterdayStr}T06:32:00`, estTime: `${yesterdayStr}T06:30:00`, status: 'on_time', delay: 2, notes: '正常' },
      { stopId: stopIds1[2], actualTime: `${yesterdayStr}T06:55:00`, estTime: `${yesterdayStr}T06:48:00`, status: 'late', delay: 7, notes: '上一站忘记签到，直接开到本站' },
      { stopId: stopIds1[3], actualTime: `${yesterdayStr}T07:18:00`, estTime: `${yesterdayStr}T07:15:00`, status: 'on_time', delay: 3, notes: '正常' }
    ];

    const checkInIds3: number[] = [];
    for (const ci of checkIns3) {
      const id = insertCheckIn.run(
        schedule3Id,
        ci.stopId,
        driver1Id,
        ci.actualTime,
        ci.estTime,
        ci.status,
        ci.delay,
        ci.notes
      ).lastInsertRowid as number;
      checkInIds3.push(id);

      if (ci.status === 'late') {
        insertLateEvent.run(
          schedule3Id,
          ci.stopId,
          id,
          ci.delay,
          ci.actualTime,
          '司机漏签上一站，导致本站晚点',
          'confirmed',
          'system'
        );
      }
    }

    for (let i = 0; i < 4; i++) {
      let status = 'boarded';
      let checkInId: number | null = checkInIds3[0];
      let notes = '正常乘车';
      let boardTime = `${yesterdayStr}T06:32:00`;

      if (i === 1) {
        status = 'boarded';
        checkInId = null;
        notes = '司机漏签本站，但学生实际上车了';
        boardTime = `${yesterdayStr}T06:40:00`;
      } else if (i >= 2) {
        checkInId = checkInIds3[i - 1];
        boardTime = checkIns3[i - 1].actualTime;
      }

      insertRideRecord.run(
        schedule3Id,
        studentIds[i],
        stopIds1[i],
        checkInId,
        status,
        boardTime,
        notes
      );
    }

    console.log('9. 场景3: 学生未上车（1号线，今天，小刚 absent）...');
    const checkIns1 = [
      { stopId: stopIds1[0], actualTime: `${dateStr}T06:31:00`, estTime: `${dateStr}T06:30:00`, status: 'on_time', delay: 1, notes: '正常' },
      { stopId: stopIds1[1], actualTime: `${dateStr}T06:39:00`, estTime: `${dateStr}T06:38:00`, status: 'on_time', delay: 1, notes: '正常' }
    ];

    const checkInIds1: number[] = [];
    for (const ci of checkIns1) {
      const id = insertCheckIn.run(
        schedule1Id,
        ci.stopId,
        driver1Id,
        ci.actualTime,
        ci.estTime,
        ci.status,
        ci.delay,
        ci.notes
      ).lastInsertRowid as number;
      checkInIds1.push(id);
    }

    for (let i = 0; i < 4; i++) {
      if (i < 2) {
        insertRideRecord.run(
          schedule1Id,
          studentIds[i],
          stopIds1[i],
          checkInIds1[i],
          'boarded',
          checkIns1[i].actualTime,
          '正常乘车'
        );
      } else if (i === 2) {
        insertRideRecord.run(
          schedule1Id,
          studentIds[i],
          stopIds1[i],
          null,
          'absent',
          null,
          '学生未在站点等候，联系家长称今天请假'
        );
      } else {
        insertRideRecord.run(
          schedule1Id,
          studentIds[i],
          stopIds1[i],
          null,
          'pending',
          null,
          '待乘车'
        );
      }
    }

    console.log('10. 场景4: 家长误报（昨天的申诉，已复核驳回）...');
    insertComplaint.run(
      studentIds[0],
      schedule3Id,
      'late',
      '我家小明说校车晚点了40分钟，到学校都迟到了，要求给个说法！',
      '小明爸爸',
      '13900139001',
      `${yesterdayStr}T08:30:00`,
      'rejected',
      2,
      '已核实实际情况，查看GPS轨迹和签到记录',
      '经核实，校车实际只晚点3分钟，学生所述与事实不符。GPS显示车辆正常行驶，签到记录也证明准点。可能是学生记错时间或与家长沟通有误。已与家长沟通解释清楚。',
      1,
      `${yesterdayStr}T10:15:00`
    );

    console.log('11. 场景5: 待处理申诉（今天的晚点申诉）...');
    insertComplaint.run(
      studentIds[4],
      schedule2Id,
      'late',
      '今天下雨，校车晚点半个多小时，孩子到学校都快上课了！',
      '小强爸爸',
      '13900139005',
      `${dateStr}T07:45:00`,
      'investigating',
      3,
      '正在核实签到记录和GPS数据',
      null,
      null,
      null
    );

    insertComplaint.run(
      studentIds[2],
      schedule1Id,
      'no_show',
      '我们家小刚在站点等了20分钟都没看到校车，不知道什么情况！',
      '小刚爸爸',
      '13900139003',
      `${dateStr}T07:10:00`,
      'pending',
      null,
      null,
      null,
      null,
      null
    );

    console.log('✅ 种子数据插入完成！');
    console.log('');
    console.log('📊 数据概览:');
    console.log(`  线路: ${(db.prepare('SELECT COUNT(*) as count FROM routes').get() as any).count} 条`);
    console.log(`  站点: ${(db.prepare('SELECT COUNT(*) as count FROM stops').get() as any).count} 个`);
    console.log(`  车辆: ${(db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as any).count} 辆`);
    console.log(`  司机: ${(db.prepare('SELECT COUNT(*) as count FROM drivers').get() as any).count} 人`);
    console.log(`  学生: ${(db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count} 人`);
    console.log(`  排班: ${(db.prepare('SELECT COUNT(*) as count FROM schedules').get() as any).count} 条`);
    console.log(`  签到: ${(db.prepare('SELECT COUNT(*) as count FROM check_ins').get() as any).count} 条`);
    console.log(`  乘车记录: ${(db.prepare('SELECT COUNT(*) as count FROM ride_records').get() as any).count} 条`);
    console.log(`  迟到事件: ${(db.prepare('SELECT COUNT(*) as count FROM late_events').get() as any).count} 条`);
    console.log(`  申诉: ${(db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count} 条`);
    console.log('');
    console.log('🎯 场景说明:');
    console.log('  1. 雨天晚点 - 2号线今天因下雨全程晚点15-28分钟');
    console.log('  2. 司机漏签到 - 1号线昨天司机漏签第2站，导致后续晚点');
    console.log('  3. 学生未上车 - 1号线今天小刚未在站点等候，标记为absent');
    console.log('  4. 家长误报 - 昨天小明家长投诉晚点40分钟，经核实驳回');
    console.log('  5. 待处理申诉 - 2条待处理申诉（雨天晚点+未上车）');
  });

  seedTransaction();
}

initDatabase();
seedData();
