from datetime import datetime, timedelta
import uuid
import models


def seed_data(db):
    buildings = ["1号楼", "2号楼", "3号楼"]
    rooms_per_building = [f"{i}01" for i in range(1, 5)] + [f"{i}02" for i in range(1, 4)]
    
    student_names = [
        "张伟", "王芳", "李娜", "刘洋", "陈静", "杨帆", "赵敏", "黄磊", "周杰", "吴静",
        "徐明", "孙丽", "马超", "朱婷", "胡军", "郭涛", "何琳", "高峰", "林达", "罗敏",
        "郑凯", "梁宇", "谢婷", "宋佳", "唐亮", "韩雪", "曹阳", "许晴", "邓超", "冯巩"
    ]
    
    students = []
    for i in range(30):
        building_idx = i % 3
        room_idx = i % 7
        student = models.Student(
            id=str(uuid.uuid4()),
            name=student_names[i],
            student_no=f"2024{building_idx + 1}{room_idx + 1:02d}{i + 1:02d}",
            building=buildings[building_idx],
            room=rooms_per_building[room_idx],
            phone=f"138{i:08d}"
        )
        students.append(student)
        db.add(student)
    
    db.flush()
    
    keys = []
    key_idx = 1
    for building in buildings:
        for room in rooms_per_building[:7]:
            for j in range(2):
                key = models.Key(
                    key_number=f"{building}-{room}-{j + 1}",
                    building=building,
                    room=room,
                    key_type="room",
                    status="available"
                )
                keys.append(key)
                db.add(key)
                key_idx += 1
    
    for building in buildings:
        for area in ["大厅", "走廊", "天台"]:
            key = models.Key(
                key_number=f"{building}-公共-{area}",
                building=building,
                room=area,
                key_type="public",
                status="available"
            )
            keys.append(key)
            db.add(key)
            key_idx += 1
    
    db.flush()
    
    borrow_records = []
    base_time = datetime.utcnow() - timedelta(days=7)
    
    for i in range(15):
        key = keys[i % 20]
        student = students[i % 30]
        borrow_time = base_time + timedelta(hours=i * 6)
        expected_return = borrow_time + timedelta(hours=4)
        
        if i < 12:
            actual_return = expected_return + timedelta(hours=i % 3)
            is_overdue = i in [3, 7, 11]
        else:
            actual_return = None
            is_overdue = i in [12, 13, 14]
        
        record = models.BorrowRecord(
            key_id=key.id,
            student_id=student.id,
            student_name=student.name,
            borrower_role="student",
            borrow_time=borrow_time,
            expected_return_time=expected_return,
            actual_return_time=actual_return,
            is_overdue=is_overdue,
            operator="管理员" if i % 2 == 0 else "宿管阿姨",
            remark=f"第{i + 1}条借还记录"
        )
        borrow_records.append(record)
        db.add(record)
        
        if actual_return is None:
            key.status = "borrowed"
            key.current_holder = student.name
    
    db.flush()
    
    lost_records = []
    lost_key_indices = [22, 25, 28, 31, 34]
    
    for i in range(5):
        key = keys[lost_key_indices[i]]
        student = students[(i + 5) % 30]
        lost_time = base_time + timedelta(days=i + 1)
        
        status = "replaced" if i < 2 else "lost"
        replace_time = lost_time + timedelta(days=1) if i < 2 else None
        
        record = models.LostRecord(
            key_id=key.id,
            student_name=student.name,
            lost_time=lost_time,
            lost_reason=f"遗失原因{i + 1}：不慎丢失",
            replace_fee=20.0 + i * 5,
            replace_time=replace_time,
            new_key_id=None,
            status=status,
            operator="管理员"
        )
        lost_records.append(record)
        db.add(record)
        
        key.status = "lost"
    
    db.flush()
    
    if len(lost_records) >= 2:
        new_key1 = models.Key(
            key_number=f"{buildings[0]}-101-补1",
            building=buildings[0],
            room="101",
            key_type="room",
            status="available"
        )
        db.add(new_key1)
        db.flush()
        lost_records[0].new_key_id = new_key1.id
        
        new_key2 = models.Key(
            key_number=f"{buildings[1]}-202-补1",
            building=buildings[1],
            room="202",
            key_type="room",
            status="available"
        )
        db.add(new_key2)
        db.flush()
        lost_records[1].new_key_id = new_key2.id
    
    action_types = ["create_key", "borrow", "return", "update_key", "report_lost", "replace_key"]
    operators = ["管理员", "宿管阿姨", "系统管理员"]
    
    for i in range(20):
        log = models.OperationLog(
            key_id=keys[i % len(keys)].id if i < 15 else None,
            action=action_types[i % len(action_types)],
            operator=operators[i % len(operators)],
            operator_role="admin" if i % 2 == 0 else "staff",
            detail=f"操作日志第{i + 1}条：{action_types[i % len(action_types)]}",
            created_at=base_time + timedelta(hours=i * 3)
        )
        db.add(log)
    
    db.commit()
